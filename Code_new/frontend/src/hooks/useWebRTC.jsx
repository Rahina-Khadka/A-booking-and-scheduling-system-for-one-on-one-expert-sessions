import { useState, useRef } from 'react';
import socketService from '../services/socketService';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Free TURN server for same-device / same-network testing
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: video ? { width: 1280, height: 720 } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsAudioEnabled(audio);
      setIsVideoEnabled(video);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const createPeerConnection = () => {
    // Close any existing connection first
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setIsConnected(true);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(bookingId, event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
      }
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const createOffer = async () => {
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketService.sendOffer(bookingId, offer);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer) => {
    try {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.sendAnswer(bookingId, answer);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer) => {
    try {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  /**
   * Called from SessionRoomPage AFTER socket is connected.
   * Registers WebRTC signaling listeners exactly once.
   */
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
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    if (!isVideoEnabled) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
          setLocalStream(localStreamRef.current);
          if (peerConnection.current) {
            peerConnection.current.addTrack(videoTrack, localStreamRef.current);
          }
        }
        setIsVideoEnabled(true);
      } catch (error) {
        console.error('Error enabling video:', error);
      }
    } else {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
          setLocalStream(localStreamRef.current);
          setIsVideoEnabled(false);
        }
      }
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  };

  return {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isConnected,
    initializeMedia,
    createOffer,
    toggleAudio,
    toggleVideo,
    cleanup,
    registerSignalingListeners,
  };
};

export default useWebRTC;
