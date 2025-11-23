import React from 'react';

interface DancingBananaProps {
  isPlaying: boolean;
}

const DancingBanana: React.FC<DancingBananaProps> = ({ isPlaying }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* DJNANA SVG */}
        <svg 
          viewBox="0 0 300 200" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg w-full h-full max-h-[85%] object-contain"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <style>
              {`
                /* --- Animation Definitions --- */
                .banana-group {
                  transform-origin: 150px 150px;
                  animation: banana-bounce 0.8s ease-in-out infinite alternate;
                }
                
                /* Normal Waving Left Arm */
                .banana-arm-left {
                  transform-origin: 135px 110px;
                  animation: wave-left 1.2s ease-in-out infinite;
                }
                
                /* COWBOY Right Arm */
                .banana-arm-right {
                  transform-origin: 155px 110px; /* Pivot at shoulder */
                  animation: cowboy-lasso 1.6s linear infinite;
                }

                .shadow {
                  transform-origin: center;
                  fill: rgba(0,0,0,0.2);
                  animation: shadow-pulse 0.8s ease-in-out infinite alternate;
                }

                /* --- Keyframes --- */
                @keyframes banana-bounce {
                  0% { transform: rotate(-5deg) translateY(0) scaleY(1); }
                  100% { transform: rotate(5deg) translateY(-5px) scaleY(1.02); }
                }

                @keyframes wave-left {
                  0% { transform: rotate(0deg); }
                  50% { transform: rotate(-40deg); }
                  100% { transform: rotate(0deg); }
                }

                /* The Cowboy Lasso Motion: A circular swing above the head */
                @keyframes cowboy-lasso {
                  0% { transform: rotate(0deg) scale(1); }
                  25% { transform: rotate(-20deg) scale(1.1); }
                  50% { transform: rotate(-40deg) scale(1); }
                  75% { transform: rotate(-20deg) scale(0.9); }
                  100% { transform: rotate(0deg) scale(1); }
                }
                
                @keyframes shadow-pulse {
                  0% { transform: translateX(-5px) scale(1.1); opacity: 0.3; }
                  100% { transform: translateX(5px) scale(0.9); opacity: 0.2; }
                }

                /* --- Music Notes --- */
                .note {
                  opacity: 0;
                  animation: float-notes 1.5s linear infinite;
                }
                .note:nth-child(1) { animation-delay: 0s; }
                .note:nth-child(2) { animation-delay: 0.5s; }
                .note:nth-child(3) { animation-delay: 1s; }

                @keyframes float-notes {
                  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                  20% { opacity: 1; }
                  100% { transform: translateY(-60px) rotate(20deg); opacity: 0; }
                }
              `}
            </style>
          </defs>

          {/* Background Floor */}
          <rect x="0" y="150" width="300" height="50" fill="#eee" />
          
          {/* DJNANA Text - Overlapping with floor */}
          <text 
            x="150" 
            y="175" 
            fontFamily="Arial, sans-serif" 
            fontSize="20" 
            fontWeight="bold"
            fill="#fbbf24"
            textAnchor="middle"
            className="drop-shadow-lg"
            style={{ letterSpacing: '0.1em' }}
          >
            DJNANA
          </text>
          
          {/* Shadow */}
          <ellipse cx="150" cy="155" rx="30" ry="8" className="shadow" />

          {/* THE DJ COWBOY BANANA */}
          <g className="banana-group">
            {/* Main Stalk/Head */}
            <path d="M140,150 Q130,130 145,80 L155,80 Q170,130 160,150" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
            {/* Stem */}
            <path d="M145,80 L147,70 L153,70 L155,80" fill="#654321" />
            
            {/* Left Arm Peel (Normal) */}
            <path className="banana-arm-left" d="M145,110 Q120,100 115,130" fill="none" stroke="#FFD700" strokeWidth="12" strokeLinecap="round" />
            
            {/* Right Arm Peel (Cowboy Style - Pointing Up) */}
            {/* Adjusted path to curve upwards for the lasso motion */}
            <path className="banana-arm-right" d="M155,110 Q170,80 190,60" fill="none" stroke="#FFD700" strokeWidth="12" strokeLinecap="round" />
            
            {/* BIG BRA */}
            {/* Left Cup */}
            <path d="M135,118 A10,11 0 0,0 150,118" fill="#ff0066" stroke="#cc0052" strokeWidth="1.5" />
            {/* Right Cup */}
            <path d="M150,118 A10,11 0 0,0 165,118" fill="#ff0066" stroke="#cc0052" strokeWidth="1.5" />
            {/* Straps */}
            <path d="M135,118 L132,110 M165,118 L168,110 M150,118 L150,122" stroke="#ff0066" strokeWidth="1.5" />

            {/* Face */}
            <circle cx="145" cy="100" r="3" fill="black" />
            <circle cx="155" cy="100" r="3" fill="black" />
            <path d="M145,110 Q150,115 155,110" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" />

            {/* DJ Headset */}
            {/* Headband */}
            <path d="M132,95 Q150,60 168,95" fill="none" stroke="#333" strokeWidth="4" strokeLinecap="round" />
            {/* Left Ear Cup */}
            <rect x="128" y="92" width="8" height="16" rx="2" fill="#444" />
            <rect x="129" y="94" width="4" height="12" rx="1" fill="#666" />
            {/* Right Ear Cup */}
            <rect x="164" y="92" width="8" height="16" rx="2" fill="#444" />
            <rect x="165" y="94" width="4" height="12" rx="1" fill="#666" />
          </g>

          {/* Floating Music Notes */}
          <g transform="translate(150, 80)">
            <g className="note" transform="translate(-60, 0)">
              <text x="0" y="0" fontFamily="Arial" fontSize="24" fill="#555">♪</text>
            </g>
            <g className="note" transform="translate(60, 10)">
              <text x="0" y="0" fontFamily="Arial" fontSize="24" fill="#555">♫</text>
            </g>
            <g className="note" transform="translate(0, -20)">
               <text x="0" y="0" fontFamily="Arial" fontSize="20" fill="#555">♩</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default DancingBanana;

