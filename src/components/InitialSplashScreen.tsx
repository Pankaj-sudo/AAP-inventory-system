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
        backgroundColor: '#0B0D17',
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
      {/* Brand Logo & Pulsing Radial Aura */}
      <div 
        style={{ 
          position: 'relative', 
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'iconBounceIn 700ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-24px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(229, 35, 38, 0.35) 0%, rgba(229, 35, 38, 0.08) 50%, transparent 75%)',
            filter: 'blur(25px)',
            animation: 'pulseAura 2.5s infinite ease-in-out'
          }}
        />
        <img
          src="/logo.png"
          alt="Anju Auto Parts Logo"
          style={{
            position: 'relative',
            maxWidth: '320px',
            maxHeight: '180px',
            width: '90%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.6))',
            borderRadius: '12px',
          }}
        />
      </div>

      {/* Smooth Fade-In-Up Title Animation */}
      <div style={{ textAlign: 'center', minHeight: '48px', overflow: 'hidden' }}>
        <h1
          className="heading-display"
          style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            margin: 0,
            color: '#FFFFFF',
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
          color: '#9CA3AF',
          fontSize: '0.85rem',
          marginTop: '4px',
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
          width: '240px',
          height: '5px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '9999px',
          marginTop: '2.25rem',
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
            background: 'linear-gradient(90deg, #E52326 0%, #10B981 100%)',
            borderRadius: '9999px',
            transition: 'width 60ms linear',
            boxShadow: '0 0 12px rgba(229, 35, 38, 0.5)'
          }}
        />
      </div>

      {/* Percentage Counter */}
      <span
        style={{
          fontSize: '0.75rem',
          color: '#6B7280',
          marginTop: '10px',
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
          0% { opacity: 0; transform: scale(0.85) translateY(-10px); }
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
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default InitialSplashScreen;
