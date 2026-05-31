import { useState, useRef, useCallback } from 'react';
import socketService from '../services/socketService';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Fallback ICE config — used if backend fetch fails
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_ICE = {
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
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
};

const fetchIceConfig = async () => {
  try {
    const res = await api.get('/auth/turn-credentials');
    if (res.data?.iceServers?.length) {
      console.log('[TURN] Got', res.data.iceServers.length, 'ICE servers from backend');
      return { iceServers: res.data.iceServers, iceCandidatePoolSize: 10, iceTransportPolicy: 'all' };
    }
  } catch (e) {
    console.warn('[TURN] Backend fetch failed, using fallback:', e.message);
  }
  return FALLBACK_ICE;
};

// ─────────────────────────────────────────────────────────────────────────────
// useWebRTC
// ─────────────────────────────────────────────────────────────────────────────
const useWebRTC = (bookingId, remoteVideoRef, remoteAudioRef) => {
  const [localStream,    setLocalStream]    = useState(null);
  const [remoteStream,   setRemoteStream]   = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected,    setIsConnected]    = useState(false);

  const pcRef             = useRef(null);
  const localStreamRef    = useRef(null);
  const iceConfigRef      = useRef(null);
  const remoteTracksRef   = useRef({ audio: null, video: null });
  const iceCandidateQueue = useRef([]);
  const remoteDescSet     = useRef(false);
  // negotiationReady: true only after the initial offer/answer is complete.
  // Prevents onnegotiationneeded from firing a second offer during setup.
  const negotiationReady  = useRef(false);
  const isOffererRef      = useRef(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const buildRemoteStream = () => {
    const tracks = [];
    if (remoteTracksRef.current.audio) tracks.push(remoteTracksRef.current.audio);
    if (remoteTracksRef.current.video) tracks.push(remoteTracksRef.current.video);
    return tracks.length > 0 ? new MediaStream(tracks) : null;
  };

  const applyRemoteStream = (s) => {
    if (!s) return;
    if (remoteVideoRef?.current) {
      remoteVideoRef.current.srcObject = s;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef?.current) {
      remoteAudioRef.current.srcObject = s;
      remoteAudioRef.current.play().catch(() => {});
    }
    setRemoteStream(s);
    setIsConnected(true);
  };

  const flushIceQueue = async (pc) => {
    const queued = iceCandidateQueue.current.splice(0);
    if (queued.length) console.log('[WebRTC] Flushing', queued.length, 'queued ICE candidates');
    for (const c of queued) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
      catch (e) { console.warn('[WebRTC] queued ICE error:', e.message); }
    }
  };

  // ── Media ──────────────────────────────────────────────────────────────────

  const initializeMedia = useCallback(async (audio = true, video = true) => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
      });
    } catch {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio, video }); }
      catch { stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); }
    }
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsAudioEnabled(stream.getAudioTracks().length > 0);
    setIsVideoEnabled(stream.getVideoTracks().length > 0);
    console.log('[WebRTC] Local tracks:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`).join(', '));
    iceConfigRef.current = await fetchIceConfig();
    return stream;
  }, []);

  // ── Create RTCPeerConnection ────────────────────────────────────────────────

  const createPeerConnection = () => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    remoteTracksRef.current   = { audio: null, video: null };
    iceCandidateQueue.current = [];
    remoteDescSet.current     = false;
    negotiationReady.current  = false;   // block onnegotiationneeded until setup done
    setRemoteStream(null);

    const iceConfig = iceConfigRef.current || FALLBACK_ICE;
    console.log('[WebRTC] New RTCPeerConnection,', iceConfig.iceServers.length, 'ICE servers');
    const pc = new RTCPeerConnection(iceConfig);

    // Add local tracks BEFORE setting onnegotiationneeded.
    // This prevents the handler from firing during addTrack() calls.
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('[WebRTC] addTrack →', track.kind, 'enabled:', track.enabled);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Set onnegotiationneeded AFTER addTrack so it only fires for future
    // renegotiations (e.g. video toggle), not for the initial track setup.
    pc.onnegotiationneeded = async () => {
      // Only fire after initial offer/answer is complete, and only on offerer side
      if (!negotiationReady.current) {
        console.log('[WebRTC] onnegotiationneeded suppressed (initial setup)');
        return;
      }
      if (!isOffererRef.current) return;
      if (pc.signalingState !== 'stable') return;
      console.log('[WebRTC] onnegotiationneeded — renegotiating');
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.sendOffer(bookingId, pc.localDescription);
        console.log('[WebRTC] Renegotiation offer sent');
      } catch (err) {
        console.error('[WebRTC] onnegotiationneeded error:', err.message);
      }
    };

    pc.ontrack = (e) => {
      const track = e.track;
      console.log('[WebRTC] Remote Track Received ←', track.kind, 'readyState:', track.readyState);
      track.enabled = true;
      remoteTracksRef.current[track.kind] = track;
      const s = buildRemoteStream();
      if (s) applyRemoteStream(s);
      track.onunmute = () => {
        track.enabled = true;
        const u = buildRemoteStream();
        if (u) applyRemoteStream(u);
      };
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('[WebRTC] ICE Candidate Generated:', e.candidate.type, e.candidate.protocol);
        socketService.sendIceCandidate(bookingId, e.candidate);
      } else {
        console.log('[WebRTC] ICE gathering complete');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection State:', pc.connectionState,
        '| ICE:', pc.iceConnectionState,
        '| Signaling:', pc.signalingState);
      if (pc.connectionState === 'connected')    setIsConnected(true);
      if (pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed')        setIsConnected(false);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' ||
          pc.iceConnectionState === 'completed')  setIsConnected(true);
      if (pc.iceConnectionState === 'failed') {
        console.error('[WebRTC] ICE FAILED — attempting restart');
        // ICE restart: only offerer can restart
        if (isOffererRef.current && pc.signalingState === 'stable') {
          pc.createOffer({ iceRestart: true })
            .then(o => pc.setLocalDescription(o))
            .then(() => {
              socketService.sendOffer(bookingId, pc.localDescription);
              console.log('[WebRTC] ICE restart offer sent');
            })
            .catch(err => console.error('[WebRTC] ICE restart error:', err.message));
        }
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE Gathering:', pc.iceGatheringState);
    };

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] Signaling State:', pc.signalingState);
    };

    pcRef.current = pc;
    return pc;
  };

  // ── Signaling handlers ─────────────────────────────────────────────────────

  const handleOffer = async (offer) => {
    const pc = pcRef.current;
    if (!pc) { console.warn('[WebRTC] handleOffer: no PC'); return; }
    console.log('[WebRTC] Offer Received | signalingState:', pc.signalingState);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      remoteDescSet.current = true;
      await flushIceQueue(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.sendAnswer(bookingId, pc.localDescription);
      console.log('[WebRTC] Answer Sent | signalingState:', pc.signalingState);
      // Answerer: mark negotiation complete so future onnegotiationneeded can fire
      negotiationReady.current = true;
    } catch (err) {
      console.error('[WebRTC] handleOffer error:', err.message);
    }
  };

  const handleAnswer = async (answer) => {
    const pc = pcRef.current;
    if (!pc) { console.warn('[WebRTC] handleAnswer: no PC'); return; }
    console.log('[WebRTC] Answer Received | signalingState:', pc.signalingState);
    if (pc.signalingState !== 'have-local-offer') {
      console.warn('[WebRTC] handleAnswer: unexpected signalingState, ignoring');
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      remoteDescSet.current = true;
      await flushIceQueue(pc);
      console.log('[WebRTC] Remote desc set from answer | signalingState:', pc.signalingState);
      // Offerer: mark negotiation complete so future onnegotiationneeded can fire
      negotiationReady.current = true;
    } catch (err) {
      console.error('[WebRTC] handleAnswer error:', err.message);
    }
  };

  const handleIceCandidate = async (candidate) => {
    const pc = pcRef.current;
    if (!pc) return;
    console.log('[WebRTC] ICE Candidate Received | remoteDescSet:', remoteDescSet.current);
    if (!remoteDescSet.current) {
      iceCandidateQueue.current.push(candidate);
      return;
    }
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
    catch (err) { console.warn('[WebRTC] addIceCandidate error:', err.message); }
  };

  // ── Register socket listeners ───────────────────────────────────────────────

  const registerSignalingListeners = useCallback(() => {
    if (!socketService.socket) return;
    socketService.socket.off('webrtc-offer');
    socketService.socket.off('webrtc-answer');
    socketService.socket.off('webrtc-ice-candidate');
    socketService.socket.on('webrtc-offer',         ({ offer })     => handleOffer(offer));
    socketService.socket.on('webrtc-answer',        ({ answer })    => handleAnswer(answer));
    socketService.socket.on('webrtc-ice-candidate', ({ candidate }) => handleIceCandidate(candidate));
    console.log('[WebRTC] Signaling listeners registered');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Offerer ────────────────────────────────────────────────────────────────

  const startAsOfferer = async () => {
    isOffererRef.current = true;
    const pc = createPeerConnection();
    try {
      console.log('[WebRTC] Creating Offer');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socketService.sendOffer(bookingId, pc.localDescription);
      console.log('[WebRTC] Offer Sent | signalingState:', pc.signalingState);
    } catch (err) {
      console.error('[WebRTC] startAsOfferer error:', err.message);
    }
  };

  // ── Answerer ───────────────────────────────────────────────────────────────

  const startAsAnswerer = () => {
    isOffererRef.current = false;
    createPeerConnection();
    console.log('[WebRTC] Answerer ready, waiting for offer');
  };

  // ── Unified entry point ─────────────────────────────────────────────────────

  const createOffer = useCallback(async (isPolite = false) => {
    if (isPolite) { startAsAnswerer(); }
    else          { await startAsOfferer(); }
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio toggle ────────────────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
      console.log('[WebRTC] Audio', track.enabled ? 'unmuted' : 'muted');
    }
  }, []);

  // ── Video toggle ────────────────────────────────────────────────────────────

  const toggleVideo = useCallback(async () => {
    if (!isVideoEnabled) {
      try {
        const vs = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        });
        const vt = vs.getVideoTracks()[0];
        const existingAudio = localStreamRef.current?.getAudioTracks() || [];
        const newStream = new MediaStream([...existingAudio, vt]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video' || s.track === null);
          if (videoSender) {
            await videoSender.replaceTrack(vt);
            console.log('[WebRTC] Video track replaced via replaceTrack');
          } else {
            pcRef.current.addTrack(vt, newStream);
            console.log('[WebRTC] Video track added (renegotiation will follow)');
          }
        }
        setIsVideoEnabled(true);
      } catch (err) {
        console.error('[WebRTC] toggleVideo error:', err.message);
      }
    } else {
      const vt = localStreamRef.current?.getVideoTracks()[0];
      if (vt) {
        vt.stop();
        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const vs = senders.find(s => s.track?.kind === 'video');
          if (vs) await vs.replaceTrack(null);
        }
        const existingAudio = localStreamRef.current?.getAudioTracks() || [];
        const newStream = new MediaStream([...existingAudio]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setIsVideoEnabled(false);
        console.log('[WebRTC] Video stopped');
      }
    }
  }, [isVideoEnabled]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current    = null;
    iceConfigRef.current      = null;
    remoteTracksRef.current   = { audio: null, video: null };
    iceCandidateQueue.current = [];
    remoteDescSet.current     = false;
    negotiationReady.current  = false;
    isOffererRef.current      = false;
    pcRef.current?.close();
    pcRef.current             = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    console.log('[WebRTC] Cleaned up');
  }, []);

  return {
    localStream, remoteStream, isAudioEnabled, isVideoEnabled, isConnected,
    initializeMedia, createOffer, toggleAudio, toggleVideo, cleanup,
    registerSignalingListeners,
    peerConnection: pcRef,
  };
};

export default useWebRTC;
