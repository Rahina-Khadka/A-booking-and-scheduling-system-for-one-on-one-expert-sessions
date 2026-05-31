import { useState, useRef, useCallback } from 'react';
import socketService from '../services/socketService';
import api from '../services/api';

// ── ICE configuration ─────────────────────────────────────────────────────────
// Multiple STUN + TURN servers for maximum reliability across networks.
// TURN is essential when both peers are behind strict NAT/firewalls (common
// on mobile networks and corporate WiFi).
const FALLBACK_ICE = {
  iceServers: [
    // Google STUN — fast public IP discovery
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Open Relay TURN — relay fallback when direct/STUN fails
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
    // Metered free TURN (secondary relay)
    {
      urls: [
        'turn:a.relay.metered.ca:80',
        'turn:a.relay.metered.ca:80?transport=tcp',
        'turn:a.relay.metered.ca:443',
        'turn:a.relay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all', // try direct first, fall back to TURN
};

const fetchIceServers = async () => {
  try {
    const res = await api.get('/auth/turn-credentials');
    if (res.data?.iceServers) return { iceServers: res.data.iceServers, iceCandidatePoolSize: 10 };
  } catch {}
  return FALLBACK_ICE;
};

// ── Hook ──────────────────────────────────────────────────────────────────────
const useWebRTC = (bookingId) => {
  const [localStream,    setLocalStream]    = useState(null);
  const [remoteStream,   setRemoteStream]   = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected,    setIsConnected]    = useState(false);

  const peerConnection  = useRef(null);
  const localStreamRef  = useRef(null);
  const iceConfigRef    = useRef(null);

  // Queue ICE candidates that arrive before setRemoteDescription is called.
  // They are flushed once the remote description is set.
  const iceCandidateQueue = useRef([]);
  const remoteDescSet     = useRef(false);

  // Accumulate remote tracks by kind so a second ontrack call (video arriving
  // after audio) never loses the first track.
  const remoteTracksRef = useRef({ audio: null, video: null });

  // ── Media ───────────────────────────────────────────────────────────────────
  const initializeMedia = useCallback(async (audio = true, video = false) => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audio
          ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          : false,
        video: video
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : false,
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
  }, []);

  // ── Rebuild remote MediaStream from accumulated tracks ──────────────────────
  const buildRemoteStream = () => {
    const tracks = [];
    if (remoteTracksRef.current.audio) tracks.push(remoteTracksRef.current.audio);
    if (remoteTracksRef.current.video) tracks.push(remoteTracksRef.current.video);
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  };

  // ── Create RTCPeerConnection ────────────────────────────────────────────────
  const createPeerConnection = async () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    remoteTracksRef.current   = { audio: null, video: null };
    iceCandidateQueue.current = [];   // clear queued candidates for fresh connection
    remoteDescSet.current     = false;
    setRemoteStream(null);

    const iceConfig = iceConfigRef.current || await fetchIceServers();
    const pc = new RTCPeerConnection(iceConfig);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('[WebRTC] addTrack →', track.kind, 'enabled:', track.enabled);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Receive remote tracks
    pc.ontrack = (e) => {
      const track = e.track;
      console.log('[WebRTC] ontrack ←', track.kind, 'enabled:', track.enabled);
      track.enabled = true;
      remoteTracksRef.current[track.kind] = track;
      const s = buildRemoteStream();
      if (s) { setRemoteStream(s); setIsConnected(true); }
      track.onunmute = () => {
        track.enabled = true;
        const updated = buildRemoteStream();
        if (updated) setRemoteStream(updated);
      };
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socketService.sendIceCandidate(bookingId, e.candidate);
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] connectionState:', pc.connectionState);
      if (pc.connectionState === 'connected')    setIsConnected(true);
      if (pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed')        setIsConnected(false);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] iceConnectionState:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' ||
          pc.iceConnectionState === 'completed')  setIsConnected(true);
    };

    peerConnection.current = pc;
    return pc;
  };

  // ── Offerer: create PC + send explicit offer ────────────────────────────────
  const startAsOfferer = async () => {
    const pc = await createPeerConnection();
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Sending offer');
      socketService.sendOffer(bookingId, pc.localDescription);
    } catch (err) {
      console.error('[WebRTC] startAsOfferer error:', err);
    }
  };

  // ── Answerer: create PC and wait ────────────────────────────────────────────
  const startAsAnswerer = async () => {
    await createPeerConnection();
    console.log('[WebRTC] Answerer ready, waiting for offer');
  };

  // ── Unified entry point (called from SessionRoomPage) ──────────────────────
  const createOffer = useCallback(async (isPolite = false) => {
    if (isPolite) {
      await startAsAnswerer();
    } else {
      await startAsOfferer();
    }
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Signaling handlers ─────────────────────────────────────────────────────
  // All handlers read peerConnection.current at call-time via the ref,
  // so they are never stale regardless of when the socket listener was registered.

  const handleOffer = async (offer) => {
    const pc = peerConnection.current;
    if (!pc) { console.warn('[WebRTC] handleOffer: no PC'); return; }
    console.log('[WebRTC] Received offer, signalingState:', pc.signalingState);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      remoteDescSet.current = true;
      // Flush any ICE candidates that arrived before the remote description
      await flushIceCandidateQueue(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] Sending answer');
      socketService.sendAnswer(bookingId, pc.localDescription);
    } catch (err) {
      console.error('[WebRTC] handleOffer error:', err.message);
    }
  };

  const handleAnswer = async (answer) => {
    const pc = peerConnection.current;
    if (!pc) { console.warn('[WebRTC] handleAnswer: no PC'); return; }
    console.log('[WebRTC] Received answer, signalingState:', pc.signalingState);
    if (pc.signalingState !== 'have-local-offer') {
      console.warn('[WebRTC] handleAnswer: wrong state, ignoring');
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      remoteDescSet.current = true;
      // Flush any ICE candidates that arrived before the remote description
      await flushIceCandidateQueue(pc);
    } catch (err) {
      console.error('[WebRTC] handleAnswer error:', err.message);
    }
  };

  const handleIceCandidate = async (candidate) => {
    const pc = peerConnection.current;
    if (!pc) return;
    if (!remoteDescSet.current) {
      // Remote description not set yet — queue the candidate
      console.log('[WebRTC] Queuing ICE candidate (remote desc not set yet)');
      iceCandidateQueue.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[WebRTC] addIceCandidate error:', err.message);
    }
  };

  // Flush all queued ICE candidates after remote description is set
  const flushIceCandidateQueue = async (pc) => {
    const queue = iceCandidateQueue.current;
    if (queue.length === 0) return;
    console.log('[WebRTC] Flushing', queue.length, 'queued ICE candidates');
    iceCandidateQueue.current = [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Queued ICE candidate error:', err.message);
      }
    }
  };

  // ── Register signaling socket listeners ────────────────────────────────────
  // The lambdas below call the handler functions at invocation time, so they
  // always use the current peerConnection.current — no stale closure issue.
  const registerSignalingListeners = useCallback(() => {
    if (!socketService.socket) return;
    socketService.socket.off('webrtc-offer');
    socketService.socket.off('webrtc-answer');
    socketService.socket.off('webrtc-ice-candidate');
    socketService.socket.on('webrtc-offer',         ({ offer })     => handleOffer(offer));
    socketService.socket.on('webrtc-answer',        ({ answer })    => handleAnswer(answer));
    socketService.socket.on('webrtc-ice-candidate', ({ candidate }) => handleIceCandidate(candidate));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio toggle ───────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsAudioEnabled(track.enabled); }
  }, []);

  // ── Video toggle ───────────────────────────────────────────────────────────
  const toggleVideo = useCallback(async () => {
    if (!isVideoEnabled) {
      const vs = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      });
      const vt = vs.getVideoTracks()[0];

      // Update local stream for preview (keep existing audio tracks)
      const existingAudio = localStreamRef.current?.getAudioTracks() || [];
      const newStream = new MediaStream([...existingAudio, vt]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);

      if (peerConnection.current) {
        const senders = peerConnection.current.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video' || s.track === null);
        if (videoSender) {
          // Replace the existing (null or stopped) video sender — no renegotiation needed
          await videoSender.replaceTrack(vt);
        } else {
          // No video sender at all — add one (triggers renegotiation)
          peerConnection.current.addTrack(vt, localStreamRef.current);
        }
      }
      setIsVideoEnabled(true);
    } else {
      const vt = localStreamRef.current?.getVideoTracks()[0];
      if (vt) {
        vt.stop();
        if (peerConnection.current) {
          const senders = peerConnection.current.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) await videoSender.replaceTrack(null);
        }
        const existingAudio = localStreamRef.current?.getAudioTracks() || [];
        const newStream = new MediaStream([...existingAudio]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setIsVideoEnabled(false);
      }
    }
  }, [isVideoEnabled]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    remoteTracksRef.current   = { audio: null, video: null };
    iceCandidateQueue.current = [];
    remoteDescSet.current     = false;
    peerConnection.current?.close();
    peerConnection.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, []);

  return {
    localStream, remoteStream, isAudioEnabled, isVideoEnabled, isConnected,
    initializeMedia, createOffer, toggleAudio, toggleVideo, cleanup,
    registerSignalingListeners, peerConnection,
  };
};

export default useWebRTC;
