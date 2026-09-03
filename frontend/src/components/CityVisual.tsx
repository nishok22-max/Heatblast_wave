import type { SVGProps } from "react";

export type CityName =
  | "Ahmedabad"
  | "Delhi"
  | "Mumbai"
  | "Bengaluru"
  | "Chennai"
  | "Hyderabad"
  | "Kolkata"
  | string;

interface CityConfig {
  name: string;
  state: string;
  landscapeTag: string;
  svgContent: React.ReactNode;
}

/**
 * Premium Cinematic Editorial City Visual System.
 * Renders high-fidelity architectural silhouettes, atmospheric heat haze gradients,
 * and environmental context for 7 supported Indian cities — 100% offline & local.
 */
export function CityVisual({
  city = "Ahmedabad",
  airTemp = 41.2,
  riskLabel = "VERY HIGH",
  className = "w-full h-auto",
  ...props
}: {
  city?: CityName;
  airTemp?: number;
  riskLabel?: string;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  const normCity = city.trim();

  // Selected city vector skyline configurations
  const cityConfigs: Record<string, CityConfig> = {
    Ahmedabad: {
      name: "Ahmedabad",
      state: "Gujarat",
      landscapeTag: "Sabarmati Basin & Heritage Urban Core",
      svgContent: (
        <g>
          {/* Heritage Gate & Dome */}
          <path d="M140 160V110C140 102 148 95 160 95C172 95 180 102 180 110V160H140Z" fill="#882C18" fillOpacity="0.85" />
          <path d="M160 78L172 95H148L160 78Z" fill="#B83232" />
          
          {/* Sidi Saiyyed / Minaret Accent */}
          <rect x="210" y="45" width="20" height="115" rx="2" fill="#D96224" />
          <path d="M220 30L230 45H210L220 30Z" fill="#B83232" />
          <circle cx="220" cy="68" r="5" fill="#F7F2E8" />
          
          {/* Ellisbridge Arch & Riverfront */}
          <path d="M260 160V120H320V160H260Z" fill="#B83232" fillOpacity="0.8" />
          <path d="M272 160V132C272 126 278 122 290 122C302 122 308 126 308 160H272Z" fill="#161616" />

          {/* Highrise Urban Fabric */}
          <rect x="350" y="65" width="48" height="95" rx="3" fill="#E76F2E" fillOpacity="0.9" />
          <rect x="360" y="78" width="10" height="12" rx="1" fill="#F7F2E8" fillOpacity="0.7" />
          <rect x="376" y="78" width="10" height="12" rx="1" fill="#F7F2E8" fillOpacity="0.7" />
          <rect x="360" y="98" width="10" height="12" rx="1" fill="#F7F2E8" fillOpacity="0.7" />
          <rect x="376" y="98" width="10" height="12" rx="1" fill="#F7F2E8" fillOpacity="0.7" />
          
          {/* Sabarmati River Stream */}
          <path d="M0 156C120 150 240 164 360 154C420 149 470 157 500 154V180H0V156Z" fill="#5FA99C" fillOpacity="0.75" />
        </g>
      ),
    },
    Delhi: {
      name: "Delhi",
      state: "National Capital Region",
      landscapeTag: "Yamuna Floodplain & Monumental Urban Axis",
      svgContent: (
        <g>
          {/* Monumental India Gate Arch Silhouette */}
          <path d="M200 160V60H270V160H248V110C248 100 240 92 235 92C230 92 222 100 222 110V160H200Z" fill="#B83232" fillOpacity="0.9" />
          <path d="M190 60H280V50H190V60Z" fill="#D96224" />
          
          {/* Rashtrapati Bhavan Dome */}
          <path d="M110 160V105H170V160H110Z" fill="#D96224" fillOpacity="0.7" />
          <path d="M140 80C125 80 120 95 120 105H160C160 95 155 80 140 80Z" fill="#E6B85C" />
          <rect x="138" y="72" width="4" height="10" fill="#B83232" />

          {/* NCR Skyline & Canopy */}
          <rect x="310" y="55" width="40" height="105" rx="2" fill="#E76F2E" fillOpacity="0.8" />
          <circle cx="390" cy="130" r="30" fill="#5FA99C" fillOpacity="0.6" />
          <circle cx="430" cy="135" r="25" fill="#46867B" fillOpacity="0.7" />
          
          {/* Yamuna Water Layer */}
          <path d="M0 162C140 158 260 166 380 160C440 157 480 163 500 160V180H0V162Z" fill="#5FA99C" fillOpacity="0.7" />
        </g>
      ),
    },
    Mumbai: {
      name: "Mumbai",
      state: "Maharashtra",
      landscapeTag: "Arabian Sea Coastline & Financial Peninsula",
      svgContent: (
        <g>
          {/* Gateway of India Landmark Arch */}
          <path d="M130 160V70H200V160H182V115C182 105 174 98 165 98C156 98 148 105 148 115V160H130Z" fill="#9A3412" fillOpacity="0.9" />
          <path d="M165 55L175 70H155L165 55Z" fill="#B83232" />

          {/* Bandra-Worli Sea Link Cables */}
          <path d="M250 160L290 40L330 160" stroke="#E6B85C" strokeWidth="4" />
          <line x1="290" y1="40" x2="260" y2="160" stroke="#F0C86B" strokeWidth="1.5" strokeOpacity="0.8" />
          <line x1="290" y1="40" x2="275" y2="160" stroke="#F0C86B" strokeWidth="1.5" strokeOpacity="0.8" />
          <line x1="290" y1="40" x2="305" y2="160" stroke="#F0C86B" strokeWidth="1.5" strokeOpacity="0.8" />
          <line x1="290" y1="40" x2="320" y2="160" stroke="#F0C86B" strokeWidth="1.5" strokeOpacity="0.8" />

          {/* Coastal Highrise Towers */}
          <rect x="360" y="45" width="42" height="115" rx="3" fill="#D96224" />
          <rect x="415" y="60" width="35" height="100" rx="3" fill="#E76F2E" fillOpacity="0.85" />

          {/* Ocean Waves Base */}
          <path d="M0 155C100 150 200 162 300 152C400 145 460 158 500 152V180H0V155Z" fill="#5FA99C" fillOpacity="0.8" />
        </g>
      ),
    },
    Bengaluru: {
      name: "Bengaluru",
      state: "Karnataka",
      landscapeTag: "Deccan Plateau & High-Tech Garden City",
      svgContent: (
        <g>
          {/* Vidhana Soudha Facade */}
          <rect x="120" y="90" width="100" height="70" fill="#D96224" fillOpacity="0.85" />
          <path d="M170 65C155 65 150 78 150 90H190C190 78 185 65 170 65Z" fill="#E6B85C" />
          <rect x="168" y="55" width="4" height="10" fill="#B83232" />

          {/* Tech Park Highrise & Canopy */}
          <rect x="250" y="50" width="55" height="110" rx="4" fill="#161616" fillOpacity="0.9" />
          <rect x="320" y="65" width="45" height="95" rx="4" fill="#E76F2E" fillOpacity="0.8" />
          
          {/* Garden City Trees & Parks */}
          <circle cx="390" cy="125" r="32" fill="#5FA99C" />
          <circle cx="435" cy="130" r="28" fill="#46867B" />
          <circle cx="360" cy="140" r="24" fill="#2D8A56" />

          {/* Ground Terrain */}
          <path d="M0 160C150 155 250 165 350 158C430 152 470 161 500 158V180H0V160Z" fill="#70B8AA" fillOpacity="0.6" />
        </g>
      ),
    },
    Chennai: {
      name: "Chennai",
      state: "Tamil Nadu",
      landscapeTag: "Coromandel Coast & Coastal Urban Belt",
      svgContent: (
        <g>
          {/* Kapaleeshwarar Gopuram Temple Tower Silhouette */}
          <path d="M140 160L155 50H185L200 160H140Z" fill="#B83232" fillOpacity="0.9" />
          <line x1="145" y1="75" x2="195" y2="75" stroke="#E6B85C" strokeWidth="2" />
          <line x1="148" y1="100" x2="192" y2="100" stroke="#E6B85C" strokeWidth="2" />
          <line x1="150" y1="125" x2="190" y2="125" stroke="#E6B85C" strokeWidth="2" />

          {/* Marina Beach Lighthouse */}
          <rect x="250" y="55" width="18" height="105" fill="#D96224" />
          <polygon points="259,38 268,55 250,55" fill="#E6B85C" />
          <circle cx="259" cy="46" r="4" fill="#F7F2E8" />

          {/* Port Infrastructure & Modern City */}
          <rect x="300" y="70" width="50" height="90" rx="3" fill="#E76F2E" fillOpacity="0.85" />
          <rect x="365" y="85" width="40" height="75" rx="3" fill="#7DA7D2" fillOpacity="0.8" />

          {/* Bay of Bengal Ocean Surface */}
          <path d="M0 156C120 152 240 162 360 154C420 150 470 158 500 154V180H0V156Z" fill="#5FA99C" fillOpacity="0.8" />
        </g>
      ),
    },
    Hyderabad: {
      name: "Hyderabad",
      state: "Telangana",
      landscapeTag: "Musi River Basin & Deccan Heritage Hub",
      svgContent: (
        <g>
          {/* Iconic Charminar Four Minarets Facade */}
          <rect x="130" y="85" width="80" height="75" fill="#D96224" fillOpacity="0.85" />
          <path d="M150 160V120C150 112 158 105 170 105C182 105 190 112 190 120V160H150Z" fill="#161616" />
          {/* Minarets */}
          <rect x="125" y="35" width="12" height="125" fill="#B83232" />
          <rect x="203" y="35" width="12" height="125" fill="#B83232" />
          <path d="M131 22L139 35H123L131 22Z" fill="#E6B85C" />
          <path d="M209 22L217 35H201L209 22Z" fill="#E6B85C" />

          {/* Cyberabad Modern IT Skyline */}
          <rect x="260" y="45" width="45" height="115" rx="3" fill="#161616" fillOpacity="0.9" />
          <rect x="320" y="60" width="50" height="100" rx="3" fill="#E76F2E" fillOpacity="0.8" />

          {/* Hussain Sagar Lake Base */}
          <path d="M0 158C130 154 250 164 360 156C430 152 470 160 500 156V180H0V158Z" fill="#5FA99C" fillOpacity="0.7" />
        </g>
      ),
    },
    Kolkata: {
      name: "Kolkata",
      state: "West Bengal",
      landscapeTag: "Hooghly River Delta & Cultural Heritage Core",
      svgContent: (
        <g>
          {/* Howrah Bridge Cantilever Steel Truss Landmark */}
          <path d="M100 160L160 40L220 160" stroke="#D96224" strokeWidth="5" fill="none" />
          <path d="M220 160L280 40L340 160" stroke="#D96224" strokeWidth="5" fill="none" />
          <line x1="160" y1="40" x2="280" y2="40" stroke="#D96224" strokeWidth="4" />
          <line x1="100" y1="130" x2="340" y2="130" stroke="#B83232" strokeWidth="3" />
          {/* Cross Truss Bracing */}
          <line x1="130" y1="160" x2="160" y2="40" stroke="#E6B85C" strokeWidth="1.5" strokeOpacity="0.7" />
          <line x1="190" y1="160" x2="160" y2="40" stroke="#E6B85C" strokeWidth="1.5" strokeOpacity="0.7" />
          <line x1="250" y1="160" x2="280" y2="40" stroke="#E6B85C" strokeWidth="1.5" strokeOpacity="0.7" />
          <line x1="310" y1="160" x2="280" y2="40" stroke="#E6B85C" strokeWidth="1.5" strokeOpacity="0.7" />

          {/* Victoria Memorial Dome Silhouette */}
          <path d="M370 160V110H430V160H370Z" fill="#B83232" fillOpacity="0.75" />
          <path d="M400 85C385 85 380 98 380 110H420C420 98 415 85 400 85Z" fill="#E6B85C" />

          {/* Hooghly River Stream Base */}
          <path d="M0 156C120 150 240 162 360 152C420 148 470 156 500 152V180H0V156Z" fill="#5FA99C" fillOpacity="0.8" />
        </g>
      ),
    },
  };

  // Fallback to Ahmedabad if exact match not found
  const targetConfig = cityConfigs[normCity] ?? cityConfigs.Ahmedabad;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100/80 via-surface to-amber-200/50 border border-amber-300/60 p-4 shadow-sm ${className}`}>
      {/* Cinematic Environmental Vector Canvas */}
      <svg
        viewBox="0 0 500 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover select-none pointer-events-none"
        {...props}
      >
        {/* Background Atmospheric Heat Sun Motif & Rays */}
        <circle cx="110" cy="85" r="60" fill="#F0C86B" fillOpacity="0.25" />
        <circle cx="110" cy="85" r="42" fill="#E6B85C" fillOpacity="0.35" />
        <circle cx="110" cy="85" r="24" fill="#E76F2E" fillOpacity="0.2" />

        <line x1="110" y1="15" x2="110" y2="25" stroke="#E76F2E" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
        <line x1="110" y1="145" x2="110" y2="155" stroke="#E76F2E" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
        <line x1="40" y1="85" x2="50" y2="85" stroke="#E76F2E" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />
        <line x1="170" y1="85" x2="180" y2="85" stroke="#E76F2E" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.4" />

        {/* City-Specific Architectural Vectors */}
        {targetConfig.svgContent}
      </svg>

      {/* Cinematic Location Overlay Badge */}
      <div className="absolute top-3.5 left-3.5 bg-surface/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-200 shadow-sm flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-brand animate-ping" />
        <div>
          <div className="text-[9px] font-extrabold uppercase tracking-wider text-amber-900 leading-none">
            {targetConfig.landscapeTag}
          </div>
          <div className="text-[14px] font-black text-ink leading-tight mt-0.5 tracking-tight">
            {targetConfig.name.toUpperCase()}, {targetConfig.state.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Weather & Thermal Risk Pill Overlay */}
      <div className="absolute bottom-3.5 right-3.5 bg-navy/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-md flex items-center gap-3">
        <div className="text-right">
          <div className="text-[9px] uppercase font-bold text-slate-400 leading-none">
            Shade Air Temp
          </div>
          <div className="text-[13px] font-bold text-amber-400 tnum leading-tight">
            {airTemp.toFixed(1)} °C
          </div>
        </div>
        <div className="w-px h-6 bg-slate-700" />
        <div className="text-right">
          <div className="text-[9px] uppercase font-bold text-slate-400 leading-none">
            Heat Risk
          </div>
          <div className="text-[12px] font-extrabold text-red-400 tracking-wider">
            {riskLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
