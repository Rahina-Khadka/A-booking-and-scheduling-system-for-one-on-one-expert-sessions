import { useState, useRef } from 'react';
import socketService from '../services/socketService';
import api from '../services/api';

const FALLBACK_ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turn:openrelay.metered.ca:80?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

const fetchIceServers = async () => {
  try {
    const res = await api.get('/auth/turn-credentials');
    if (res.data?.iceServers) return { iceServers: res.data.iceServers, iceCandidatePoolSize: 10 };
  } catch {}
  return FALLBACK_ICE;
};

const useWebRTC = (bookingId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const iceConfigRef = useRef(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isPoliteRef = useRef(false); // set from outside

  const initializeMedia = async (audio = true, video = false) => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
      });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({ audio, video });
    }
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsAudioEnabled(audio ? stream.getAudioTracks().length > 0 : false);
    setIsVideoEnabled(video ? stream.getVideoTracks().length > 0 : false);
    iceConfigRef.current = await fetchIceServers();
    return stream;
  };

  const createPeerConnection = async (isPolite) => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    isPoliteRef.current = isPolite;
    const iceConfig = iceConfigRef.current || await fetchIceServers();
    const pc = new RTCPeerConnection(iceConfig);

    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log('[WebRTC] Adding tracks to PC:', tracks.map(t => `${t.kind}:${t.enabled}`));
      tracks.forEach(t => pc.addTrack(t, localStreamRef.current));
    }

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      setIsConnected(true);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socketService.sendIceCandidate(bookingId, e.candidate);
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (['disconnected', 'failed'].includes(pc.connectionState)) setIsConnected(false);
      if (pc.connectionState === 'connected') setIsConnected(true);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsConnected(true);
      }
    };

    // Perfect negotiation: handle onnegotiationneeded
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        socketService.sendOffer(bookingId, pc.localDescription);
      } catch (e) {
        console.error('[WebRTC] negotiationneeded error:', e);
      } finally {
        makingOfferRef.current = false;
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const createOffer = async (isPolite = false) => {
    const pc = await createPeerConnection(isPolite);
    try {
      makingOfferRef.current = true;
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketService.sendOffer(bookingId, offer);
    } finally {
      makingOfferRef.current = false;
    }
  };

  const handleOffer = async (offer) => {
    const pc = peerConnection.current;
    if (!pc) return;

    const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
    ignoreOfferRef.current = !isPoliteRef.current && offerCollision;

    if (ignoreOfferRef.current) {
      console.log('[WebRTC] Ignoring colliding offer (impolite side)');
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.sendAnswer(bookingId, answer);
    } catch (e) {
      console.error('[WebRTC] handleOffer error:', e.message);
    }
  };

  const handleAnswer = async (answer) => {
    const pc = peerConnection.current;
    if (!pc) return;
    if (pc.signalingState === 'stable') {
      console.log('[WebRTC] Ignoring answer in stable state');
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
      console.error('[WebRTC] handleAnswer error:', e.message);
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (peerConnection.current) {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        if (!ignoreOfferRef.current) {
          console.warn('[WebRTC] ICE candidate error:', e.message);
        }
      }
    }
  };

  const registerSignalingListeners = () => {
    if (!socketService.socket) return;
    socketService.socket.off('webrtc-offer');
    socketService.socket.off('webrtc-answer');
    socketService.socket.off('webrtc-ice-candidate');
    socketService.socket.on('webrtc-offer', ({ offer }) => handleOffer(offer));
    socketService.socket.on('webrtc-answer', ({ answer }) => handleAnswer(answer));
    socketService.socket.on('webrtc-ice-candidate', ({ candidate }) => handleIceCandidate(candidate));
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsAudioEnabled(track.enabled); }
  };

  const toggleVideo = async () => {
    if (!isVideoEnabled) {
      const vs = await navigator.mediaDevices.getUserMedia({ video: true });
      const vt = vs.getVideoTracks()[0];
      const existingAudio = localStreamRef.current?.getAudioTracks() || [];
      const newStream = new MediaStream([...existingAudio, vt]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      if (peerConnection.current) {
        peerConnection.current.addTrack(vt, newStream);
      }
      setIsVideoEnabled(true);
    } else {
      const vt = localStreamRef.current?.getVideoTracks()[0];
      if (vt) {
        vt.stop();
        const existingAudio = localStreamRef.current?.getAudioTracks() || [];
        const newStream = new MediaStream([...existingAudio]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setIsVideoEnabled(false);
      }
    }
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    peerConnection.current?.close();
    peerConnection.current = null;
    setLocalStream(null); setRemoteStream(null); setIsConnected(false);
  };

  return {
    localStream, remoteStream, isAudioEnabled, isVideoEnabled, isConnected,
    initializeMedia, createOffer, toggleAudio, toggleVideo, cleanup,
    registerSignalingListeners, peerConnection,
  };
};

export default useWebRTC;
