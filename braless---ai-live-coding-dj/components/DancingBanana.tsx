import React, { useEffect, useRef } from 'react';

interface DancingBananaProps {
  isPlaying: boolean;
}

const DancingBanana: React.FC<DancingBananaProps> = ({ isPlaying }) => {
  const bananaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!bananaRef.current) return;

    const banana = bananaRef.current;
    let rotation = 0;
    let bounce = 0;
    let direction = 1;

    const animate = () => {
      if (isPlaying) {
        // Dancing animation
        rotation += 5 * direction;
        bounce = Math.sin(Date.now() / 200) * 10;
        
        // Change direction occasionally for more dynamic movement
        if (Math.random() > 0.98) {
          direction *= -1;
        }

        banana.style.transform = `translateY(${bounce}px) rotate(${rotation}deg) scale(1.1)`;
        banana.style.transition = 'transform 0.1s ease-out';
      } else {
        // Idle state
        banana.style.transform = 'translateY(0) rotate(0deg) scale(1)';
        banana.style.transition = 'transform 0.5s ease-out';
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="flex items-center justify-center h-full">
      <div
        ref={bananaRef}
        className="relative"
        style={{ transformOrigin: 'center center' }}
      >
        {/* Banana SVG */}
        <svg
          width="80"
          height="100"
          viewBox="0 0 80 100"
          className="drop-shadow-lg"
        >
          {/* Banana body */}
          <path
            d="M 40 20 Q 50 30 55 50 Q 50 80 40 90 Q 30 80 25 50 Q 30 30 40 20 Z"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          {/* Banana highlight */}
          <ellipse cx="45" cy="45" rx="8" ry="15" fill="#FFEB3B" opacity="0.6" />
          {/* Eyes */}
          <circle cx="35" cy="40" r="3" fill="#000" />
          <circle cx="45" cy="40" r="3" fill="#000" />
          {/* Smile */}
          <path
            d="M 32 50 Q 40 58 48 50"
            stroke="#000"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Arms (dancing) */}
          {isPlaying && (
            <>
              <path
                d="M 20 50 Q 10 40 5 35"
                stroke="#FFD700"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <path
                d="M 60 50 Q 70 40 75 35"
                stroke="#FFD700"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
              />
            </>
          )}
        </svg>
        {isPlaying && (
          <div className="absolute -top-2 -right-2 text-yellow-400 text-xs animate-bounce">
            🎵
          </div>
        )}
      </div>
    </div>
  );
};

export default DancingBanana;

