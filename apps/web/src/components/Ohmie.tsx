import { motion } from 'framer-motion';
import type { Emotion } from '../lib/supabase';

const motionByEmotion: Record<Emotion, string> = {
  happy: 'happy-bob', sad: 'sad-sway', angry: 'angry-shake', surprised: 'surprise-pop', sleeping: 'sleep-breathe',
  excited: 'excited-hop', tired: 'tired-droop', lonely: 'lonely-sway', curious: 'curious-tilt',
};

type Props = { emotion: Emotion; size?: number; interaction?: string | null; className?: string };

export function Ohmie({ emotion, size = 250, interaction, className = '' }: Props) {
  const mouth = () => {
    switch (emotion) {
      case 'sad': case 'lonely': return <path d="M108 173 Q125 158 142 173" />;
      case 'angry': return <path d="M108 171 Q125 184 142 171" />;
      case 'surprised': return <ellipse cx="125" cy="169" rx="8" ry="11" />;
      case 'sleeping': case 'tired': return <path d="M111 171 Q125 176 139 171" />;
      default: return <path d="M108 164 Q125 184 142 164" />;
    }
  };
  return <motion.div key={emotion} className={`ohmie-wrap ${motionByEmotion[emotion]} ${interaction ? `react-${interaction}` : ''} ${className}`} initial={{ opacity: 0, y: 8, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 18 }}>
    <svg width={size} height={size} viewBox="0 0 250 250" role="img" aria-label={`Ohmie feeling ${emotion}`}>
      <defs>
        <radialGradient id="bulb" cx="38%" cy="25%" r="75%"><stop offset="0" stopColor="#fff"/><stop offset=".68" stopColor="#ececea"/><stop offset="1" stopColor="#bcbcb8"/></radialGradient>
        <linearGradient id="helmet" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#494947"/><stop offset=".42" stopColor="#171716"/><stop offset="1" stopColor="#060606"/></linearGradient>
        <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#454543"/><stop offset="1" stopColor="#101010"/></linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000" floodOpacity=".18"/></filter>
      </defs>
      <ellipse cx="125" cy="223" rx="68" ry="12" fill="#171717" opacity=".1" />
      <g filter="url(#shadow)" stroke="#161616" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        <path fill="url(#bulb)" d="M125 38c-43 0-76 31-76 72 0 30 17 48 31 65 6 7 9 13 10 23h70c1-10 4-16 10-23 14-17 31-35 31-65 0-41-33-72-76-72Z" />
        <path fill="url(#base)" d="M90 197h70v17c0 11-9 19-20 19h-30c-11 0-20-8-20-19v-17Z" />
        <path d="M94 207h62M101 219h48" stroke="#d9d9d6" strokeWidth="4" />
        <path fill="#111" d="M46 91c4-30 28-51 61-57l18-1 18 1c33 6 57 27 61 57H46Z" />
        <path fill="url(#helmet)" d="M39 91h172c7 0 12 5 12 11v6H27v-6c0-6 5-11 12-11Z" />
        <path d="M125 46l-10 22h12l-5 17 19-26h-13l8-13Z" fill="#fafaf8" stroke="#fafaf8" strokeWidth="1.5" />
        <path d="M64 96h122" stroke="#727270" strokeWidth="2" opacity=".72" />
        <path d="M80 120v6M170 120v6" stroke="#111" strokeWidth="8" />
        {emotion === 'angry' && <><path d="m69 115 22 8M181 115l-22 8" strokeWidth="5"/><path d="m184 147 3-9 5 7 8-2-4 7 4 6-9-1-4 7-2-9-8-3Z" fill="#222" strokeWidth="2"/></>}
        {emotion === 'surprised' && <><ellipse cx="80" cy="124" rx="7" ry="10" fill="#111"/><ellipse cx="170" cy="124" rx="7" ry="10" fill="#111"/><path d="M125 156v8" strokeWidth="2" /></>}
        {emotion === 'sleeping' && <><path d="M70 125q10 8 20 0M160 125q10 8 20 0" strokeWidth="4"/><path d="M184 91q10-10 20 0l-7 17h-14Z" fill="#fff" strokeWidth="2"/><text x="190" y="82" fill="#444" stroke="none" fontSize="15" fontFamily="sans-serif">z</text></>}
        {emotion === 'tired' && <><path d="M69 126h22M159 126h22" strokeWidth="6"/><path d="M184 81h20M190 73h15" stroke="#555" strokeWidth="3"/></>}
        {emotion === 'sad' && <><path d="M70 116q10 8 20 1M160 117q10 7 20-1" strokeWidth="3"/><path d="M79 136q7 7 0 14" stroke="#aaa" strokeWidth="3"/></>}
        {emotion === 'curious' && <><path d="M69 117h22" strokeWidth="3"/><path d="M171 112v8" strokeWidth="3"/></>}
        {mouth()}
        <path d="M110 213h30" stroke="#fff" strokeWidth="3" />
      </g>
      {(emotion === 'excited' || emotion === 'happy') && <g className="sparkles" fill="none" stroke="#666" strokeWidth="2.5"><path d="M31 82v14M24 89h14M218 135v12M212 141h12"/><path d="m49 142 4 5m-2-8-4 4"/></g>}
    </svg>
  </motion.div>;
}
