import React, { useState } from "react";
import { createRoot } from "react-dom/client";

const BralessLogo = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="logo-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width="600"
        height="200"
        viewBox="0 0 600 200"
        xmlns="http://www.w3.org/2000/svg"
        className="braless-svg"
      >
        <defs>
          {/* Vibrant Gradient for the equalizer bars */}
          <linearGradient id="soundGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF00CC" />   {/* Neon Pink */}
            <stop offset="50%" stopColor="#333399" />   {/* Deep Blurple */}
            <stop offset="100%" stopColor="#00FFFF" />  {/* Cyan */}
          </linearGradient>

          {/* Glow Filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

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
              key={i}
              className="equalizer-bar"
              x={10 + i * 25} // Spread across the text area
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
          filter="url(#glow)"
        >
          BRALESS
        </text>
      </svg>
      
      <div className={`subtitle ${isHovered ? 'visible' : ''}`}>
        Unrestricted Sound
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
        }

        .logo-container:hover {
          transform: scale(1.02);
        }

        /* Hover effect to re-trigger a small ripple could be added here via JS class toggling, 
           but we keep it simple as a final state logo. */

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 100px;
          fill: white;
        }

        .logo-stroke {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 100px;
          fill: none;
          stroke: rgba(255, 255, 255, 0.5);
          stroke-width: 1px;
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawStroke 2s ease-out forwards;
          opacity: 0.8;
        }

        .equalizer-bar {
          /* Play the settle animation once, keep final state */
          animation: equalize-settle 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0.9;
        }

        @keyframes drawStroke {
          0% { stroke-dashoffset: 400; opacity: 0; }
          20% { opacity: 1; }
          100% { 
            stroke-dashoffset: 0; 
            opacity: 0.3; /* Fade outline slightly so the fill pops */
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
          margin-top: -10px;
          font-family: 'Outfit', sans-serif;
          font-weight: 200;
          letter-spacing: 8px;
          text-transform: uppercase;
          font-size: 14px;
          color: rgba(255,255,255,0.8);
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

const App = () => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(circle at center, #111 0%, #000 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <BralessLogo />
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);