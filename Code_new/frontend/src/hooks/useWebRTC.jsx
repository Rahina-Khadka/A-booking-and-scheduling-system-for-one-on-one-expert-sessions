import { useState, useRef, useEffect } from 'react';
import socketService from '../services/socketService';

/**
 * Custom hook for WebRTC functionality
 * Handles peer-to-peer audio/video connections
 */
const useWebRTC = (bookingId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  // ICE servers configuration (using free STUN servers)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  /**
   * Initialize local media stream
   */
  const initializeMedia = async (audio = true, video = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video: video ? { width: 1280, height: 720 } : false
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

  /**
   * Create peer connection
   */
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setIsConnected(true);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(bookingId, event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  /**
   * Create and send offer
   */
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

  /**
   * Handle incoming offer
   */
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

  /**
   * Handle incoming answer
   */
  const handleAnswer = async (answer) => {
    try {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  /**
   * Handle incoming ICE candidate
   */
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
   * Toggle audio
   */
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  /**
   * Toggle video
   */
  const toggleVideo = async () => {
    if (!isVideoEnabled) {
      // Enable video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
          setLocalStream(localStreamRef.current);
          
          // Add track to peer connection if it exists
          if (peerConnection.current) {
            peerConnection.current.addTrack(videoTrack, localStreamRef.current);
          }
        }
        
        setIsVideoEnabled(true);
      } catch (error) {
        console.error('Error enabling video:', error);
      }
    } else {
      // Disable video
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

  /**
   * Cleanup
   */
  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  };

  // Setup WebRTC signaling listeners
  useEffect(() => {
    socketService.onOffer(({ offer }) => handleOffer(offer));
    socketService.onAnswer(({ answer }) => handleAnswer(answer));
    socketService.onIceCandidate(({ candidate }) => handleIceCandidate(candidate));

    return () => {
      cleanup();
    };
  }, [bookingId]);

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
    cleanup
  };
};

export default useWebRTC;
