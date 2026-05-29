import { useState, useRef } from 'react';
import socketService from '../services/socketService';
import api from '../services/api';

const FALLBACK_ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
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

  const initializeMedia = async (audio = true, video = false) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: video ? { width: 1280, height: 720 } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsAudioEnabled(audio);
    setIsVideoEnabled(video);
    // Pre-fetch ICE servers while media initializes
    iceConfigRef.current = await fetchIceServers();
    return stream;
  };

  const createPeerConnection = async () => {
    if (peerConnection.current) peerConnection.current.close();
    const iceConfig = iceConfigRef.current || await fetchIceServers();
    const pc = new RTCPeerConnection(iceConfig);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    }
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      setIsConnected(true);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) socketService.sendIceCandidate(bookingId, e.candidate);
    };
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed'].includes(pc.connectionState)) setIsConnected(false);
      if (pc.connectionState === 'connected') setIsConnected(true);
    };
    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering:', pc.iceGatheringState);
    };
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsConnected(true);
      }
    };
    peerConnection.current = pc;
    return pc;
  };

  const createOffer = async () => {
    const pc = await createPeerConnection();
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    socketService.sendOffer(bookingId, offer);
  };

  const handleOffer = async (offer) => {
    // If already connected, this is a renegotiation offer — don't recreate peer connection
    if (peerConnection.current && peerConnection.current.connectionState === 'connected') {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socketService.sendAnswer(bookingId, answer);
      return;
    }
    const pc = await createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketService.sendAnswer(bookingId, answer);
  };

  const handleAnswer = async (answer) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (candidate) => {
    if (peerConnection.current) {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] ICE candidate error:', e.message);
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
      // Create new stream with existing audio + new video track
      const existingAudio = localStreamRef.current?.getAudioTracks() || [];
      const newStream = new MediaStream([...existingAudio, vt]);
      localStreamRef.current = newStream;
      setLocalStream(newStream); // new reference triggers useEffect
      if (peerConnection.current) {
        peerConnection.current.addTrack(vt, newStream);
        // Renegotiate to send new video track to remote peer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socketService.sendOffer(bookingId, offer);
      }
      setIsVideoEnabled(true);
    } else {
      const vt = localStreamRef.current?.getVideoTracks()[0];
      if (vt) {
        vt.stop();
        const existingAudio = localStreamRef.current?.getAudioTracks() || [];
        const newStream = new MediaStream([...existingAudio]);
        localStreamRef.current = newStream;
        setLocalStream(newStream); // new reference triggers useEffect
        // Renegotiate to remove video track from remote peer
        if (peerConnection.current) {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socketService.sendOffer(bookingId, offer);
        }
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
