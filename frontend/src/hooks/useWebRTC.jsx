import { useState, useRef, useCallback } from 'react';
import socketService from '../services/socketService';

// ── ICE configuration ─────────────────────────────────────────────────────────
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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
  iceTransportPolicy: 'all',
};

// ── Hook ──────────────────────────────────────────────────────────────────────
const useWebRTC = (bookingId, remoteVideoRef, remoteAudioRef) => {
  const [localStream,    setLocalStream]    = useState(null);
  const [remoteStream,   setRemoteStream]   = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected,    setIsConnected]    = useState(false);

  const peerConnection    = useRef(null);
  const localStreamRef    = useRef(null);
  const remoteTracksRef   = useRef({ audio: null, video: null });
  const iceCandidateQueue = useRef([]);   // candidates queued before remote desc is set
  const remoteDescSet     = useRef(false);

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
    return stream;
  }, []);

  // ── Build remote stream from accumulated tracks ─────────────────────────────
  const buildRemoteStream = () => {
    const tracks = [];
    if (remoteTracksRef.current.audio) tracks.push(remoteTracksRef.current.audio);
    if (remoteTracksRef.current.video) tracks.push(remoteTracksRef.current.video);
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  };

  // ── Flush queued ICE candidates ─────────────────────────────────────────────
  const flushQueue = async (pc) => {
    const q = iceCandidateQueue.current.splice(0);
    for (const c of q) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
      catch (e) { console.warn('[WebRTC] queued ICE error:', e.message); }
    }
  };

  // ── Create RTCPeerConnection ────────────────────────────────────────────────
  const createPeerConnection = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    remoteTracksRef.current   = { audio: null, video: null };
    iceCandidateQueue.current = [];
    remoteDescSet.current     = false;
    setRemoteStream(null);

    const pc = new RTCPeerConnection(ICE_CONFIG);

    // Add all local tracks (audio + video if active)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('[WebRTC] addTrack →', track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Receive remote tracks
    pc.ontrack = (e) => {
      const track = e.track;
      console.log('[WebRTC] ontrack ←', track.kind);
      track.enabled = true;
      remoteTracksRef.current[track.kind] = track;

      const s = buildRemoteStream();
      if (!s) return;

      // Assign directly to DOM elements immediately — do NOT wait for React
      // state update + re-render cycle, which can miss the assignment if the
      // video element was not yet in the DOM when the effect ran.
      if (remoteVideoRef?.current) {
        remoteVideoRef.current.srcObject = s;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef?.current) {
        remoteAudioRef.current.srcObject = s;
        remoteAudioRef.current.play().catch(() => {});
      }

      // Also update React state so the UI switches from waiting → video view
      setRemoteStream(s);
      setIsConnected(true);

      track.onunmute = () => {
        track.enabled = true;
        const u = buildRemoteStream();
        if (!u) return;
        if (remoteVideoRef?.current) { remoteVideoRef.current.srcObject = u; remoteVideoRef.current.play().catch(() => {}); }
        if (remoteAudioRef?.current) { remoteAudioRef.current.srcObject = u; remoteAudioRef.current.play().catch(() => {}); }
        setRemoteStream(u);
      };
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socketService.sendIceCandidate(bookingId, e.candidate);
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] connectionState:', pc.connectionState);
      if (pc.connectionState === 'connected')                          setIsConnected(true);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') setIsConnected(false);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] iceState:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') setIsConnected(true);
    };

    peerConnection.current = pc;
    return pc;
  };

  // ── Signaling handlers (read refs at call-time — never stale) ───────────────
  const handleOffer = async (offer) => {
    const pc = peerConnection.current;
    if (!pc) { console.warn('[WebRTC] handleOffer: no PC'); return; }
    console.log('[WebRTC] handleOffer, state:', pc.signalingState);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      remoteDescSet.current = true;
      await flushQueue(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.sendAnswer(bookingId, pc.localDescription);
      console.log('[WebRTC] answer sent');
    } catch (err) {
      console.error('[WebRTC] handleOffer error:', err.message);
    }
  };

  const handleAnswer = async (answer) => {
    const pc = peerConnection.current;
    if (!pc) { console.warn('[WebRTC] handleAnswer: no PC'); return; }
    console.log('[WebRTC] handleAnswer, state:', pc.signalingState);
    if (pc.signalingState !== 'have-local-offer') {
      console.warn('[WebRTC] handleAnswer: wrong state, ignoring');
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      remoteDescSet.current = true;
      await flushQueue(pc);
    } catch (err) {
      console.error('[WebRTC] handleAnswer error:', err.message);
    }
  };

  const handleIceCandidate = async (candidate) => {
    const pc = peerConnection.current;
    if (!pc) return;
    if (!remoteDescSet.current) {
      iceCandidateQueue.current.push(candidate);
      return;
    }
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
    catch (err) { console.warn('[WebRTC] ICE error:', err.message); }
  };

  // ── Register socket listeners ───────────────────────────────────────────────
  // Called once after PC is created. Lambdas call handlers at invocation time
  // so they always read the latest peerConnection.current via ref.
  const registerSignalingListeners = useCallback(() => {
    if (!socketService.socket) return;
    socketService.socket.off('webrtc-offer');
    socketService.socket.off('webrtc-answer');
    socketService.socket.off('webrtc-ice-candidate');
    socketService.socket.on('webrtc-offer',         ({ offer })     => handleOffer(offer));
    socketService.socket.on('webrtc-answer',        ({ answer })    => handleAnswer(answer));
    socketService.socket.on('webrtc-ice-candidate', ({ candidate }) => handleIceCandidate(candidate));
    console.log('[WebRTC] signaling listeners registered');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start as offerer: create PC → send offer ────────────────────────────────
  const startAsOfferer = async () => {
    const pc = createPeerConnection();
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketService.sendOffer(bookingId, pc.localDescription);
      console.log('[WebRTC] offer sent');
    } catch (err) {
      console.error('[WebRTC] startAsOfferer error:', err);
    }
  };

  // ── Start as answerer: create PC → wait for offer ───────────────────────────
  const startAsAnswerer = () => {
    createPeerConnection();
    console.log('[WebRTC] answerer ready');
  };

  // ── Unified entry point ─────────────────────────────────────────────────────
  const createOffer = useCallback(async (isPolite = false) => {
    if (isPolite) {
      startAsAnswerer();
    } else {
      await startAsOfferer();
    }
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio toggle ────────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsAudioEnabled(track.enabled); }
  }, []);

  // ── Video toggle ────────────────────────────────────────────────────────────
  const toggleVideo = useCallback(async () => {
    if (!isVideoEnabled) {
      const vs = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      });
      const vt = vs.getVideoTracks()[0];
      const existingAudio = localStreamRef.current?.getAudioTracks() || [];
      const newStream = new MediaStream([...existingAudio, vt]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      if (peerConnection.current) {
        const senders = peerConnection.current.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video' || s.track === null);
        if (videoSender) {
          await videoSender.replaceTrack(vt);
        } else {
          peerConnection.current.addTrack(vt, newStream);
        }
      }
      setIsVideoEnabled(true);
    } else {
      const vt = localStreamRef.current?.getVideoTracks()[0];
      if (vt) {
        vt.stop();
        if (peerConnection.current) {
          const senders = peerConnection.current.getSenders();
          const vs = senders.find(s => s.track?.kind === 'video');
          if (vs) await vs.replaceTrack(null);
        }
        const existingAudio = localStreamRef.current?.getAudioTracks() || [];
        const newStream = new MediaStream([...existingAudio]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setIsVideoEnabled(false);
      }
    }
  }, [isVideoEnabled]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current    = null;
    remoteTracksRef.current   = { audio: null, video: null };
    iceCandidateQueue.current = [];
    remoteDescSet.current     = false;
    peerConnection.current?.close();
    peerConnection.current    = null;
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
