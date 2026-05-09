import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Minus, Activity, Dumbbell, Play, CheckCircle, Sword } from 'lucide-react';

const TaskArea = ({ unlockTier, setUnlockTier, userLevel, setUserLevel, setUserXP, startNewSession }) => {
  const [progress, setProgress] = useState(0);
  const [isBossMode, setIsBossMode] = useState(false);
  const [damageTrigger, setDamageTrigger] = useState(0);
  const goal = isBossMode ? 50 : 30; // Max milestone
  const [isDetecting, setIsDetecting] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [exerciseType, setExerciseType] = useState('pushups'); // pushups, squats, crunches
  const [formFeedback, setFormFeedback] = useState('Good Form');
  const [viewMode, setViewMode] = useState('side'); // front or side
  const [isFormLocked, setIsFormLocked] = useState(true); // true = posture bad, false = good to go

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.9; // Drill Sergeant tone
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const lastSpokenRef = useRef(0);
  const speakThrottled = (text) => {
    const now = Date.now();
    if (now - lastSpokenRef.current > 3000) {
      speak(text);
      lastSpokenRef.current = now;
    }
  };

  const slashAudioRef = useRef(new Audio('https://actions.google.com/sounds/v1/weapons/swish.ogg'));
  const gongAudioRef = useRef(new Audio('https://actions.google.com/sounds/v1/bells/tolling_bell.ogg'));

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const poseRef = useRef(null);
  const isDownRef = useRef(false);

  const startDetection = async () => {
    setIsDetecting(true);
    setIsModelLoading(true);
    setErrorMsg('');
    setStatusMsg('Initializing MediaPipe Pose...');

    // Unlock audio elements by playing and immediately pausing them on user interaction
    slashAudioRef.current.play().catch(() => {}).then(() => slashAudioRef.current.pause());
    gongAudioRef.current.play().catch(() => {}).then(() => gongAudioRef.current.pause());
    
    try {
      if (!window.Pose || !window.Camera) {
        throw new Error("MediaPipe libraries not loaded from CDN.");
      }

      // Initialize Pose
      const pose = new window.Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onResults);
      poseRef.current = pose;

      setStatusMsg('Starting camera...');

      // Initialize Camera
      if (videoRef.current) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        cameraRef.current = camera;
        await camera.start();
        setIsModelLoading(false);
        setStatusMsg('Detection Active');
      } else {
        throw new Error("Video element not found.");
      }

    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || String(error));
      setIsDetecting(false);
      setIsModelLoading(false);
    }
  };

  const stopDetection = () => {
    setIsDetecting(false);
    setIsModelLoading(false);
    setStatusMsg('');
    setErrorMsg('');

    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const calculateAngle = (A, B, C) => {
    if (!A || !B || !C) return 0;
    const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const playSlashSound = () => {
    try {
      slashAudioRef.current.currentTime = 0;
      slashAudioRef.current.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) { /* ignore */ }
  };

  const playGongSound = () => {
    try {
      gongAudioRef.current.currentTime = 0;
      gongAudioRef.current.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) { /* ignore */ }
  };

  const onResults = (results) => {
    // Hide loading once first result comes in
    if (isModelLoading) {
      setIsModelLoading(false);
      setStatusMsg('Detection Active');
    }

    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { videoWidth, videoHeight } = videoRef.current;

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;

      // Draw skeleton
      if (window.drawConnectors && window.POSE_CONNECTIONS) {
        window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS, { color: '#6366f1', lineWidth: 4 });
      }
      if (window.drawLandmarks) {
        window.drawLandmarks(ctx, landmarks, { color: '#10b981', lineWidth: 2, radius: 4 });
      }

      // 1. View Detection (Auto Switch)
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      let currentView = 'side';
      if (leftShoulder && rightShoulder) {
        // Z-axis difference determines if one shoulder is deeper
        const zDiff = Math.abs(leftShoulder.z - rightShoulder.z);
        currentView = zDiff > 0.15 ? 'side' : 'front';
        setViewMode(currentView);
      }

      // Exercise specific logic
      let A, B, C; // Points for angle calculation
      let thresholdDown, thresholdUp, isGoingDown;
      let angle = 0;
      let isFormValid = true;

      if (exerciseType === 'pushups') {
        A = landmarks[11]; // Left Shoulder
        B = landmarks[13]; // Left Elbow
        C = landmarks[15]; // Left Wrist
        const hip = landmarks[23];
        const ankle = landmarks[27];
        
        if (A && B && C) angle = calculateAngle(A, B, C);
        
        // Form Gate: Body straightness (Shoulder-Hip-Ankle)
        if (A && hip && ankle) {
          const bodyAngle = calculateAngle(A, hip, ankle);
          if (bodyAngle < 120) { // Relaxed from 150
            isFormValid = false;
            setFormFeedback('Keep your back straight!');
            setIsFormLocked(true);
          } else {
            setFormFeedback(currentView === 'front' ? 'Keep elbows symmetric' : 'Good Form');
            setIsFormLocked(false);
          }
        }
        
        thresholdDown = 110; // Relaxed from 90
        thresholdUp = 140;   // Relaxed from 160
        isGoingDown = true;

      } else if (exerciseType === 'squats') {
        A = landmarks[23]; // Left Hip
        B = landmarks[25]; // Left Knee
        C = landmarks[27]; // Left Ankle
        const rightKnee = landmarks[26];
        
        if (A && B && C) angle = calculateAngle(A, B, C);
        
        // Form Gate: Hip depth below knee for full rep
        if (A && B && isDownRef.current) {
          // Relaxed: Hip just needs to approach knee level, not go below it
          if (A.y > B.y + 0.15) { 
            setFormFeedback('Go lower!');
            isFormValid = false;
            setIsFormLocked(true);
          } else {
            setFormFeedback('Perfect Depth');
            setIsFormLocked(false);
          }
        } else if (!isDownRef.current) {
          setFormFeedback('Good Form');
          setIsFormLocked(false);
        }

        thresholdDown = 120; // Relaxed from 90
        thresholdUp = 150;   // Relaxed from 160
        isGoingDown = true;

      } else if (exerciseType === 'crunches') {
        A = landmarks[11]; // Left Shoulder
        B = landmarks[23]; // Left Hip
        C = landmarks[25]; // Left Knee
        
        if (A && B && C) angle = calculateAngle(A, B, C);
        
        if (angle < 50) { // Relaxed from 80
          setFormFeedback('Do not pull neck!');
          isFormValid = false;
          setIsFormLocked(true);
        } else {
          setFormFeedback('Contract your core');
          setIsFormLocked(false);
        }
        
        thresholdDown = 130; // Lying flat (Relaxed from 140)
        thresholdUp = 110;   // Sitting up (Relaxed from 100)
        isGoingDown = false;
      }

      // Unified Counting System
      if (A && B && C && A.visibility > 0.5 && B.visibility > 0.5 && C.visibility > 0.5) {
        if (isGoingDown) {
          if (angle < thresholdDown) {
            isDownRef.current = true;
          } else if (angle > thresholdUp && isDownRef.current) {
            isDownRef.current = false;
            if (isFormValid && !isFormLocked) incrementRep();
          }
        } else {
          if (angle > thresholdDown) {
            isDownRef.current = true;
          } else if (angle < thresholdUp && isDownRef.current) {
            isDownRef.current = false;
            if (isFormValid && !isFormLocked) incrementRep();
          }
        }
      }
    }
  };

  const incrementRep = () => {
    playSlashSound();
    setProgress(prev => {
      const newProg = prev + 1;
      
      // RPG XP System (Double XP for Boss mode)
      setUserXP(xp => {
        const xpGain = isBossMode ? 30 : 15;
        const nextXP = xp + xpGain;
        const xpNeeded = userLevel * 100;
        if (nextXP >= xpNeeded) {
          setUserLevel(l => l + 1);
          speak('Rank Up! You are getting stronger.');
          return nextXP - xpNeeded;
        }
        return nextXP;
      });

      if (isBossMode) {
        setDamageTrigger(prev => prev + 1); // Trigger shake animation
        if (newProg >= 50) {
          setUnlockTier(3);
          playGongSound();
          speak('Boss defeated! Incredible display of strength. All applications unlocked!');
        } else if (newProg === 25) {
          speak('The demon is weakening! Keep going!');
        }
      } else {
        // Tiered Unlocking Milestones
        if (newProg === 10) {
          setUnlockTier(1);
          speak('10 reps complete! Productivity apps unlocked.');
        } else if (newProg === 20) {
          setUnlockTier(2);
          speak('20 reps! Messaging apps unlocked.');
        } else if (newProg >= 30) {
          setUnlockTier(3);
          playGongSound();
          speak('Session complete! All applications unlocked.');
        }
      }
      return newProg;
    });
  };

  useEffect(() => {
    return () => stopDetection();
  }, []);
  
  // When switching exercise, reset the rep state logic
  useEffect(() => {
    isDownRef.current = false;
  }, [exerciseType]);

  const percent = Math.min(100, Math.round((progress / goal) * 100));

  const getExerciseTitle = () => {
    if (exerciseType === 'pushups') return 'Push-ups';
    if (exerciseType === 'squats') return 'Squats';
    if (exerciseType === 'crunches') return 'Crunches';
    return '';
  };

  const getAvatarImage = () => {
    if (exerciseType === 'pushups') return '/pushup_avatar.png';
    if (exerciseType === 'squats') return '/squat_avatar.png';
    if (exerciseType === 'crunches') return '/crunch_avatar.png';
    return '/pushup_avatar.png';
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Current Task</h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: 'var(--text-accent)', fontWeight: '600', marginBottom: '4px' }}>
            Morning Exercise
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Do 30 {getExerciseTitle()} to unlock all apps (Tiers at 10 and 20)
          </p>
        </div>
      </div>

      {/* Exercise Selection Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['pushups', 'squats', 'crunches'].map(type => (
          <button
            key={type}
            onClick={() => !isDetecting && setExerciseType(type)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '12px',
              border: `1px solid ${exerciseType === type ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}`,
              background: exerciseType === type ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.1)',
              color: exerciseType === type ? 'var(--text-accent)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: isDetecting ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
          {isBossMode ? (
            <>
              <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Demon Boss Health</span>
              <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>{goal - progress} / {goal} HP</span>
            </>
          ) : (
            <>
              <span>{progress} / {goal} {getExerciseTitle()} Completed</span>
              <span>{percent}%</span>
            </>
          )}
        </div>
        <div className="progress-container" style={{ height: isBossMode ? '16px' : '8px', border: isBossMode ? '1px solid var(--danger-color)' : 'none' }}>
          <div className="progress-bar" style={{ 
            width: isBossMode ? `${100 - percent}%` : `${percent}%`, 
            background: isBossMode ? 'var(--danger-color)' : 'var(--accent-color)' 
          }}></div>
        </div>
      </div>

      {/* Content Area switches based on lock state */}
      {unlockTier >= 3 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
          <CheckCircle size={64} color="#10b981" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>Session Completed!</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Excellent work! All your applications are now unlocked.
          </p>
          <button 
            className="btn-primary" 
            onClick={() => {
              setProgress(0);
              startNewSession();
            }}
          >
            <Play size={20} />
            Start New Session
          </button>
        </div>
      ) : (
        <>
          {/* Avatar or Camera View */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', borderRadius: '16px', background: 'rgba(0,0,0,0.1)', minHeight: '200px' }}>
            <video 
              ref={videoRef} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: isDetecting ? 'block' : 'none' }} 
              playsInline 
              muted 
            />
            
            {isDetecting && (
              <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', pointerEvents: 'none' }}
              />
            )}

            {!isDetecting && (
              <img 
                src={isBossMode ? '/boss_character.png' : getAvatarImage()} 
                alt={`${getExerciseTitle()} avatar`} 
                onAnimationEnd={() => setDamageTrigger(0)}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  animation: damageTrigger > 0 ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'float 6s ease-in-out infinite',
                  filter: damageTrigger > 0 ? 'brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)' : 'none'
                }} 
              />
            )}
            
            {isDetecting && isBossMode && (
              <img 
                src="/boss_character.png" 
                alt="Boss"
                onAnimationEnd={() => setDamageTrigger(0)}
                style={{ 
                  position: 'absolute',
                  right: '16px',
                  top: '16px',
                  width: '120px', 
                  height: '120px', 
                  objectFit: 'contain',
                  animation: damageTrigger > 0 ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'float 6s ease-in-out infinite',
                  filter: damageTrigger > 0 ? 'brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)' : 'none',
                  zIndex: 10
                }} 
              />
            )}

            {isDetecting && (
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            {/* View Mode Badge */}
            <div style={{ padding: '4px 12px', background: 'rgba(0,0,0,0.8)', borderRadius: '12px', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
              {viewMode.toUpperCase()} VIEW DETECTED
            </div>
            
            {/* Form Lock Gate */}
            <div style={{ padding: '8px 16px', background: isFormLocked ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)', backdropFilter: 'blur(4px)', borderRadius: '20px', color: 'white', fontWeight: 'bold', fontSize: '14px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isFormLocked ? '❌ Fix posture to start:' : '✅ Good form detected:'} {formFeedback}
            </div>
          </div>
        )}

        {isDetecting && isModelLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                <Activity className="animate-spin" /> {statusMsg || "Loading AI Model..."}
              </div>
            )}
          </div>

          <style>{`
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
            @keyframes shake {
              10%, 90% { transform: translate3d(-4px, 0, 0); }
              20%, 80% { transform: translate3d(8px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-16px, 0, 0); }
              40%, 60% { transform: translate3d(16px, 0, 0); }
            }
          `}</style>

          {errorMsg && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', borderRadius: '8px', marginTop: '16px', fontSize: '12px' }}>
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {statusMsg && !errorMsg && isDetecting && !isModelLoading && (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', marginTop: '16px', fontSize: '12px' }}>
              <strong>Status:</strong> {statusMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            {!isDetecting ? (
              <>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => { setIsBossMode(false); startDetection(); }}
                >
                  <Camera size={20} />
                  Start Regular
                </button>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, background: 'var(--danger-color)' }}
                  onClick={() => { 
                    setIsBossMode(true); 
                    speak('A powerful demon has appeared! Show no mercy!');
                    startDetection(); 
                  }}
                >
                  <Sword size={20} />
                  Start Boss Battle
                </button>
              </>
            ) : (
              <button 
                className="btn-primary" 
                style={{ flex: 1 }}
                onClick={stopDetection}
              >
                <Camera size={20} />
                Stop Detection
              </button>
            )}
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Or enter manually</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <button 
                className="btn-icon" 
                onClick={() => setProgress(p => Math.max(0, p - 1))}
              >
                <Minus size={20} />
              </button>
              <span style={{ fontSize: '24px', fontWeight: '600', width: '40px', textAlign: 'center' }}>{progress}</span>
              <button 
                className="btn-icon"
                onClick={() => incrementRep()}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskArea;
