import React, { useState, useRef, useEffect } from "react";

const BralessLogo: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationKey, setAnimationKey] = useState(Date.now());
  const isAnimatingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation duration: 2.5s + max delay (24 bars * 0.05s = 1.2s) = ~3.7s
  const ANIMATION_DURATION = 3700;

  const startAnimation = () => {
    if (!isAnimatingRef.current) {
      // Start new animation - use timestamp to ensure unique key
      isAnimatingRef.current = true;
      setAnimationKey(Date.now());
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Clear animation flag after animation completes
      timeoutRef.current = setTimeout(() => {
        isAnimatingRef.current = false;
        timeoutRef.current = null;
      }, ANIMATION_DURATION);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    startAnimation();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Don't clear timeout - let animation complete even if user unhovers
  };

  // Cleanup timeout only on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="logo-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        width="100%"
        height="60"
        viewBox="0 0 700 200"
        xmlns="http://www.w3.org/2000/svg"
        className="braless-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Vibrant Gradient for the equalizer bars - matching visualizer colors */}
          <linearGradient id="soundGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF00CC" />   {/* Neon Pink - from warmColors */}
            <stop offset="50%" stopColor="#9900FF" />   {/* Purple - from coolColors */}
            <stop offset="100%" stopColor="#00CCFF" />  {/* Cyan - from coolColors */}
          </linearGradient>

          {/* The Text Mask */}
          <mask id="textMask">
            <text
              x="50%"
              y="50%"
              dy=".35em"
              textAnchor="middle"
              className="logo-text"
            >
              BRALESS
            </text>
          </mask>
        </defs>

        {/* Background Group: The Visualizer Bars */}
        {/* These bars are masked by the text, so they only show "inside" the letters */}
        <g mask="url(#textMask)">
          {/* We generate multiple bars across the width of the text area */}
          {[...Array(24)].map((_, i) => (
            <rect
              key={`bar-${i}-${animationKey}`}
              className="equalizer-bar"
              x={50 + i * 25} // Spread across the text area with more left padding
              y="200" // Start at bottom
              width="22" // Slight gap between bars (25 stride)
              height="0" // Start height
              fill="url(#soundGradient)"
              style={{
                // Stagger animations based on index for a wave effect
                animationDelay: `${i * 0.05}s`, 
              }}
            />
          ))}
        </g>

        {/* Outline Layer: Draws on top for definition */}
        <text
          x="50%"
          y="50%"
          dy=".35em"
          textAnchor="middle"
          className="logo-stroke"
        >
          BRALESS
        </text>
      </svg>
      
      <div className="subtitle">
        AGENTIC DJS BEFORE GTA 6
      </div>

      <style>{`
        .logo-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
          cursor: pointer;
          width: 100%;
          overflow: visible;
          padding: 0 8px;
        }

        .logo-container:hover {
          transform: scale(1.02);
        }

        .braless-svg {
          width: 95%;
          height: auto;
          max-height: 80px;
          transform: scale(1.2);
          transform-origin: center;
          margin: 0 auto;
        }

        .logo-text {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 130px;
          fill: white;
        }

        .logo-stroke {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 130px;
          fill: none;
          stroke: rgba(255, 255, 255, 0.5);
          stroke-width: 1px;
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawStroke 2s ease-out forwards;
          opacity: 1.0;
        }

        .equalizer-bar {
          /* Play the settle animation once, keep final state */
          animation: equalize-settle 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 1.0;
        }

        @keyframes drawStroke {
          0% { stroke-dashoffset: 400; opacity: 0; }
          20% { opacity: 1; }
          100% { 
            stroke-dashoffset: 0; 
            opacity: 1.0; /* Clean, full opacity like visualizer */
          }
        }

        /* 
           Keyframes:
           1. Start at 0 height
           2. Rapidly expand to random peaks (simulating sound burst)
           3. Drop slightly
           4. Expand to full height (filling the text)
        */
        @keyframes equalize-settle {
          0% {
            height: 0px;
            y: 200px;
          }
          30% {
            height: 140px;
            y: 60px;
          }
          50% {
            height: 60px;
            y: 140px;
          }
          70% {
            height: 180px;
            y: 20px;
          }
          85% {
            height: 150px;
            y: 50px;
          }
          100% {
            height: 200px; /* Full height */
            y: 0px;
          }
        }

        .subtitle {
          margin-top: 4px;
          font-family: 'Poppins', sans-serif;
          font-weight: 200;
          letter-spacing: 4px;
          text-transform: uppercase;
          font-size: 10px;
          color: rgba(255,255,255,0.6);
          opacity: 0;
          transform: translateY(10px);
          animation: fadeUp 1s ease-out 2s forwards; /* Appear after logo settles */
        }
        
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BralessLogo;

