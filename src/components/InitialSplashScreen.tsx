import React, { useState, useEffect } from 'react';

interface InitialSplashScreenProps {
  onComplete: () => void;
}

export const InitialSplashScreen: React.FC<InitialSplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Progress bar & complete callback
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000; // 2.0 seconds total splash time

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(timer);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 400); // 400ms fade out transition
      }
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFadingOut ? 'none' : 'all',
        userSelect: 'none'
      }}
    >
      {/* Brand Icon & Pulsing Radial Aura */}
      <div 
        style={{ 
          position: 'relative', 
          marginBottom: '1.75rem',
          animation: 'iconBounceIn 700ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-14px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(246, 221, 214, 0.6), rgba(19, 53, 47, 0.15))',
            filter: 'blur(20px)',
            animation: 'pulseAura 2s infinite ease-in-out'
          }}
        />
        <div
          style={{
            position: 'relative',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: '#f6ddd6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#13352f',
            fontWeight: 800,
            fontSize: '2.25rem',
            boxShadow: '0 12px 36px rgba(19, 53, 47, 0.2)',
            border: '2px solid rgba(255,255,255,0.6)'
          }}
        >
          🌸
        </div>
      </div>

      {/* Smooth Fade-In-Up Title Animation */}
      <div style={{ textAlign: 'center', minHeight: '52px', overflow: 'hidden' }}>
        <h1
          className="heading-display"
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            margin: 0,
            color: '#13352f',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)',
            animation: 'fadeInUpTitle 800ms cubic-bezier(0.16, 1, 0.3, 1) 150ms forwards',
            opacity: 0,
            transform: 'translateY(16px)'
          }}
        >
          Anju Auto Parts
        </h1>
      </div>

      {/* Fade-In Subtitle */}
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          marginTop: '6px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-sans)',
          animation: 'fadeInSubtitle 700ms ease 350ms forwards',
          opacity: 0
        }}
      >
        Premium Experience · Beltar, Udayapur
      </p>

      {/* Progress Bar Container */}
      <div
        style={{
          width: '220px',
          height: '5px',
          backgroundColor: 'var(--border-color)',
          borderRadius: '9999px',
          marginTop: '2.5rem',
          overflow: 'hidden',
          position: 'relative',
          animation: 'fadeInProgress 600ms ease 450ms forwards',
          opacity: 0
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #13352f 0%, #34d399 100%)',
            borderRadius: '9999px',
            transition: 'width 60ms linear',
            boxShadow: '0 0 10px rgba(19, 53, 47, 0.3)'
          }}
        />
      </div>

      {/* Percentage Counter */}
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-tertiary)',
          marginTop: '8px',
          fontFamily: 'var(--font-mono)',
          fontFeatureSettings: "'tnum'",
          animation: 'fadeInProgress 600ms ease 500ms forwards',
          opacity: 0
        }}
      >
        Loading System Engine {progress}%
      </span>

      {/* CSS Keyframe Animations */}
      <style>{`
        @keyframes iconBounceIn {
          0% { opacity: 0; transform: scale(0.7) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeInUpTitle {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInSubtitle {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInProgress {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes pulseAura {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default InitialSplashScreen;
