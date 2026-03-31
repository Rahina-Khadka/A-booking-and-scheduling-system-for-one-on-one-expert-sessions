import { useState, useRef } from 'react';
import socketService from '../services/socketService';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

const useWebRTC = (bookingId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  const initializeMedia = async (audio = true, video = false) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio, video: video ? { width: 1280, height: 720 } : false });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsAudioEnabled(audio);
    setIsVideoEnabled(video);
    return stream;
  };

  const createPeerConnection = () => {
    if (peerConnection.current) peerConnection.current.close();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
    pc.ontrack = (e) => { setRemoteStream(e.streams[0]); setIsConnected(true); };
    pc.onicecandidate = (e) => { if (e.candidate) socketService.sendIceCandidate(bookingId, e.candidate); };
    pc.onconnectionstatechange = () => {
      if (['disconnected','failed'].includes(pc.connectionState)) setIsConnected(false);
      if (pc.connectionState === 'connected') setIsConnected(true);
    };
    peerConnection.current = pc;
    return pc;
  };

  const createOffer = async () => {
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketService.sendOffer(bookingId, offer);
  };

  const handleOffer = async (offer) => {
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketService.sendAnswer(bookingId, answer);
  };

  const handleAnswer = async (answer) => {
    if (peerConnection.current) await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = async (candidate) => {
    if (peerConnection.current) await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
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
      localStreamRef.current?.addTrack(vt);
      setLocalStream(localStreamRef.current);
      if (peerConnection.current) peerConnection.current.addTrack(vt, localStreamRef.current);
      setIsVideoEnabled(true);
    } else {
      const vt = localStreamRef.current?.getVideoTracks()[0];
      if (vt) { vt.stop(); localStreamRef.current?.removeTrack(vt); setLocalStream(localStreamRef.current); setIsVideoEnabled(false); }
    }
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    peerConnection.current?.close();
    peerConnection.current = null;
    setLocalStream(null); setRemoteStream(null); setIsConnected(false);
  };

  return { localStream, remoteStream, isAudioEnabled, isVideoEnabled, isConnected, initializeMedia, createOffer, toggleAudio, toggleVideo, cleanup, registerSignalingListeners };
};

export default useWebRTC;
