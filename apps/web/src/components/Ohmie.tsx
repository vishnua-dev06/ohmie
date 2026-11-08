import { motion } from 'framer-motion';
import type { Emotion } from '../lib/supabase';

const motionByEmotion: Record<Emotion, string> = {
  happy: 'happy-bob',
  sad: 'sad-sway',
  angry: 'angry-shake',
  surprised: 'surprise-pop',
  sleeping: 'sleep-breathe',
  excited: 'excited-hop',
  tired: 'tired-droop',
  lonely: 'lonely-sway',
  curious: 'curious-tilt',
};

type Props = {
  emotion: Emotion;
  size?: number;
  interaction?: string | null;
  className?: string;
};

const B = '#000000';
const W = '#ffffff';
const DG = '#a1a1aa';

function r(x: number, y: number, w = 1, h = 1, fill = B, key?: string) {
  return <rect key={key ?? `${x}-${y}-${w}-${h}-${fill}`} x={x} y={y} width={w} height={h} fill={fill} />;
}

export function Ohmie({ emotion, size = 250, interaction, className = '' }: Props) {
  return (
    <motion.div
      key={emotion}
      className={`ohmie-wrap ${motionByEmotion[emotion] ?? 'happy-bob'} ${interaction ? `react-${interaction}` : ''} ${className}`}
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="img"
        aria-label={`Ohmie feeling ${emotion}`}
        shapeRendering="crispEdges"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Ground shadow / floor mat */}
        {r(12, 37, 16, 1, '#d4d4d8', 'sh-1')}
        {r(15, 38, 10, 1, '#e4e4e7', 'sh-2')}

        {/* Stubby feet */}
        {r(14, 36, 5, 1, B, 'ft-l1')}
        {r(15, 35, 3, 1, W, 'ft-l2')}
        {r(21, 36, 5, 1, B, 'ft-r1')}
        {r(22, 35, 3, 1, W, 'ft-r2')}

        {/* Lightbulb threaded screw base */}
        {r(13, 30, 14, 1, B, 'base-rim')}
        {r(12, 31, 1, 1, B, 'b-s1-l')}
        {r(13, 31, 14, 1, W, 'b-s1-w')}
        {r(27, 31, 1, 1, B, 'b-s1-r')}
        {r(12, 32, 1, 1, B, 'b-s2-l')}
        {r(13, 32, 14, 1, B, 'b-s2-b')}
        {r(27, 32, 1, 1, B, 'b-s2-r')}
        {r(13, 33, 1, 1, B, 'b-s3-l')}
        {r(14, 33, 12, 1, W, 'b-s3-w')}
        {r(26, 33, 1, 1, B, 'b-s3-r')}
        {r(14, 34, 12, 1, B, 'base-cap')}

        {/* Lightbulb glass head */}
        {r(7, 17, 1, 1, B, 'h17-l')}{r(8, 17, 24, 1, W, 'h17-w')}{r(32, 17, 1, 1, B, 'h17-r')}
        {r(6, 18, 1, 1, B, 'h18-l')}{r(7, 18, 26, 1, W, 'h18-w')}{r(33, 18, 1, 1, B, 'h18-r')}
        {r(5, 19, 1, 1, B, 'h19-l')}{r(6, 19, 28, 1, W, 'h19-w')}{r(34, 19, 1, 1, B, 'h19-r')}
        {r(5, 20, 1, 1, B, 'h20-l')}{r(6, 20, 28, 1, W, 'h20-w')}{r(34, 20, 1, 1, B, 'h20-r')}
        {r(5, 21, 1, 1, B, 'h21-l')}{r(6, 21, 28, 1, W, 'h21-w')}{r(34, 21, 1, 1, B, 'h21-r')}
        {r(5, 22, 1, 1, B, 'h22-l')}{r(6, 22, 28, 1, W, 'h22-w')}{r(34, 22, 1, 1, B, 'h22-r')}
        {r(5, 23, 1, 1, B, 'h23-l')}{r(6, 23, 28, 1, W, 'h23-w')}{r(34, 23, 1, 1, B, 'h23-r')}
        {r(6, 24, 1, 1, B, 'h24-l')}{r(7, 24, 26, 1, W, 'h24-w')}{r(33, 24, 1, 1, B, 'h24-r')}
        {r(7, 25, 1, 1, B, 'h25-l')}{r(8, 25, 24, 1, W, 'h25-w')}{r(32, 25, 1, 1, B, 'h25-r')}
        {r(8, 26, 1, 1, B, 'h26-l')}{r(9, 26, 22, 1, W, 'h26-w')}{r(31, 26, 1, 1, B, 'h26-r')}
        {r(9, 27, 1, 1, B, 'h27-l')}{r(10, 27, 20, 1, W, 'h27-w')}{r(30, 27, 1, 1, B, 'h27-r')}
        {r(10, 28, 1, 1, B, 'h28-l')}{r(11, 28, 18, 1, W, 'h28-w')}{r(29, 28, 1, 1, B, 'h28-r')}
        {r(12, 29, 1, 1, B, 'h29-l')}{r(13, 29, 14, 1, W, 'h29-w')}{r(27, 29, 1, 1, B, 'h29-r')}

        {/* Safety Helmet */}
        {r(17, 6, 6, 1, B, 'helm-6')}
        {r(14, 7, 3, 1, B, 'helm-7-l')}{r(17, 7, 6, 1, W, 'helm-7-m')}{r(23, 7, 3, 1, B, 'helm-7-r')}
        {r(12, 8, 2, 1, B, 'helm-8-l')}{r(14, 8, 12, 1, W, 'helm-8-m')}{r(26, 8, 2, 1, B, 'helm-8-r')}
        {r(10, 9, 2, 1, B, 'helm-9-l')}{r(12, 9, 16, 1, W, 'helm-9-m')}{r(28, 9, 2, 1, B, 'helm-9-r')}
        {r(9, 10, 1, 1, B, 'helm-10-l')}{r(10, 10, 20, 1, W, 'helm-10-m')}{r(30, 10, 1, 1, B, 'helm-10-r')}
        {r(8, 11, 1, 1, B, 'helm-11-l')}{r(9, 11, 22, 1, W, 'helm-11-m')}{r(31, 11, 1, 1, B, 'helm-11-r')}
        {r(7, 12, 1, 1, B, 'helm-12-l')}{r(8, 12, 24, 1, W, 'helm-12-m')}{r(32, 12, 1, 1, B, 'helm-12-r')}
        {r(7, 13, 1, 1, B, 'helm-13-l')}{r(8, 13, 24, 1, W, 'helm-13-m')}{r(32, 13, 1, 1, B, 'helm-13-r')}
        {r(5, 14, 2, 1, B, 'helm-14-l')}{r(7, 14, 26, 1, W, 'helm-14-m')}{r(33, 14, 2, 1, B, 'helm-14-r')}
        {r(4, 15, 1, 1, B, 'helm-15-l')}{r(5, 15, 30, 1, W, 'helm-15-m')}{r(35, 15, 1, 1, B, 'helm-15-r')}
        {r(4, 16, 32, 1, B, 'helm-visor-bot')}

        {/* Helmet vertical ridge seams */}
        {r(15, 8, 1, 6, B, 'helm-seam-l')}
        {r(24, 8, 1, 6, B, 'helm-seam-r')}

        {/* Visible Lightning-Bolt Emblem on Helmet */}
        {r(20, 9, 2, 1, B, 'bolt-1')}
        {r(19, 10, 2, 1, B, 'bolt-2')}
        {r(18, 11, 5, 1, B, 'bolt-3')}
        {r(19, 12, 2, 1, B, 'bolt-4')}
        {r(18, 13, 2, 1, B, 'bolt-5')}

        {/* Emotion-specific features */}
        {emotion === 'happy' && (
          <g className="emotion-happy">
            {/* Arms raised happily */}
            {r(3, 21, 2, 2, B)}{r(4, 22, 2, 2, W)}{r(5, 23, 2, 2, B)}
            {r(35, 21, 2, 2, B)}{r(34, 22, 2, 2, W)}{r(33, 23, 2, 2, B)}
            {/* Eyes (^ ^) */}
            {r(10, 21, 1, 1, B)}{r(11, 20, 3, 1, B)}{r(14, 21, 1, 1, B)}
            {r(25, 21, 1, 1, B)}{r(26, 20, 3, 1, B)}{r(29, 21, 1, 1, B)}
            {/* Smiling open mouth */}
            {r(18, 23, 4, 1, B)}{r(17, 24, 1, 2, B)}{r(18, 24, 4, 2, W)}{r(22, 24, 1, 2, B)}{r(18, 26, 4, 1, B)}
            {/* Blush */}
            {r(8, 23, 1, 1, DG)}{r(10, 23, 1, 1, DG)}{r(9, 24, 1, 1, DG)}
            {r(29, 23, 1, 1, DG)}{r(31, 23, 1, 1, DG)}{r(30, 24, 1, 1, DG)}
            {/* Floating pixel heart */}
            {r(5, 7, 2, 1, B)}{r(8, 7, 2, 1, B)}
            {r(4, 8, 7, 2, B)}{r(5, 8, 1, 1, W)}{r(8, 8, 1, 1, W)}
            {r(5, 10, 5, 1, B)}{r(6, 11, 3, 1, B)}{r(7, 12, 1, 1, B)}
            {/* Radiant lines above helmet */}
            {r(13, 3, 1, 2, B)}{r(17, 2, 1, 3, B)}{r(23, 2, 1, 3, B)}{r(27, 3, 1, 2, B)}
          </g>
        )}

        {emotion === 'sad' && (
          <g className="emotion-sad">
            {/* Arms at sides */}
            {r(4, 27, 2, 3, B)}{r(34, 27, 2, 3, B)}
            {/* Glossy teary eyes with white highlights */}
            {r(10, 21, 4, 4, B)}{r(11, 21, 1, 1, W)}{r(13, 23, 1, 1, W)}
            {r(25, 21, 4, 4, B)}{r(26, 21, 1, 1, W)}{r(28, 23, 1, 1, W)}
            {/* Streaming tears */}
            {r(10, 25, 1, 2, B)}{r(11, 26, 2, 1, B)}{r(11, 25, 1, 1, W)}
            {r(28, 25, 1, 2, B)}{r(26, 26, 2, 1, B)}{r(27, 25, 1, 1, W)}
            {/* Downturned mouth */}
            {r(18, 25, 4, 1, B)}{r(17, 26, 1, 2, B)}{r(22, 26, 1, 2, B)}
            {/* Gloom scribble cloud above head */}
            {r(12, 3, 4, 3, B)}{r(15, 2, 4, 4, B)}{r(13, 5, 5, 2, B)}{r(14, 3, 2, 2, W)}
            {/* Stress marks */}
            {r(6, 13, 2, 1, B)}{r(8, 15, 2, 1, B)}
          </g>
        )}

        {emotion === 'angry' && (
          <g className="emotion-angry">
            {/* Clenched fists at hips */}
            {r(4, 26, 2, 3, B)}{r(34, 26, 2, 3, B)}
            {/* Sharp V-brows and furious eyes */}
            {r(10, 20, 2, 1, B)}{r(12, 21, 2, 1, B)}{r(14, 22, 2, 1, B)}{r(11, 22, 3, 2, B)}
            {r(28, 20, 2, 1, B)}{r(26, 21, 2, 1, B)}{r(24, 22, 2, 1, B)}{r(26, 22, 3, 2, B)}
            {/* Wide open yelling mouth */}
            {r(17, 24, 6, 1, B)}{r(16, 25, 1, 2, B)}{r(17, 25, 6, 2, W)}{r(23, 25, 1, 2, B)}{r(18, 27, 4, 1, B)}
            {/* Anger vein on temple */}
            {r(29, 18, 1, 4, B)}{r(31, 18, 1, 4, B)}{r(28, 19, 4, 1, B)}{r(28, 21, 4, 1, B)}
            {/* Steam puffs */}
            {r(3, 12, 3, 3, B)}{r(5, 11, 2, 2, B)}{r(4, 13, 1, 1, W)}
            {r(34, 12, 3, 3, B)}{r(33, 11, 2, 2, B)}{r(35, 13, 1, 1, W)}
          </g>
        )}

        {emotion === 'surprised' && (
          <g className="emotion-surprised">
            {/* Hands raised to cheeks */}
            {r(6, 25, 3, 3, B)}{r(7, 26, 1, 1, W)}
            {r(31, 25, 3, 3, B)}{r(32, 26, 1, 1, W)}
            {/* Raised surprised brows */}
            {r(11, 19, 3, 1, B)}{r(26, 19, 3, 1, B)}
            {/* Giant starry anime eyes with dual highlights */}
            {r(10, 20, 5, 5, B)}{r(11, 20, 2, 2, W)}{r(13, 23, 1, 1, W)}
            {r(25, 20, 5, 5, B)}{r(26, 20, 2, 2, W)}{r(28, 23, 1, 1, W)}
            {/* Round open 'O' mouth */}
            {r(18, 24, 4, 1, B)}{r(17, 25, 1, 3, B)}{r(18, 25, 4, 3, W)}{r(22, 25, 1, 3, B)}{r(18, 28, 4, 1, B)}
            {/* 3 alert rays on left */}
            {r(9, 10, 1, 3, B)}{r(12, 8, 1, 3, B)}{r(15, 9, 1, 2, B)}
            {/* Double exclamation marks !! */}
            {r(35, 7, 2, 4, B)}{r(35, 12, 2, 2, B)}
            {r(38, 7, 2, 4, B)}{r(38, 12, 2, 2, B)}
          </g>
        )}

        {emotion === 'sleeping' && (
          <g className="emotion-sleeping">
            {/* Hands folded quietly */}
            {r(17, 29, 6, 2, B)}{r(18, 29, 4, 1, W)}
            {/* Peaceful closed curved eyes */}
            {r(10, 22, 1, 1, B)}{r(11, 23, 3, 1, B)}{r(14, 22, 1, 1, B)}
            {r(25, 22, 1, 1, B)}{r(26, 23, 3, 1, B)}{r(29, 22, 1, 1, B)}
            {/* Calm mouth */}
            {r(19, 25, 2, 1, B)}
            {/* Chunky Zzz floating */}
            {r(31, 12, 3, 1, B)}{r(32, 13, 1, 1, B)}{r(31, 14, 3, 1, B)}
            {r(34, 7, 4, 1, B)}{r(36, 8, 1, 1, B)}{r(35, 9, 1, 1, B)}{r(34, 10, 4, 1, B)}
            {r(36, 2, 5, 1, B)}{r(39, 3, 1, 1, B)}{r(38, 4, 1, 1, B)}{r(37, 5, 1, 1, B)}{r(36, 6, 5, 1, B)}
          </g>
        )}

        {emotion === 'excited' && (
          <g className="emotion-excited">
            {/* Arms up joyfully */}
            {r(3, 20, 2, 2, B)}{r(4, 21, 2, 2, W)}{r(5, 22, 2, 2, B)}
            {r(35, 20, 2, 2, B)}{r(34, 21, 2, 2, W)}{r(33, 22, 2, 2, B)}
            {/* 4-point star sparkle eyes */}
            {r(12, 19, 1, 5, B)}{r(10, 21, 5, 1, B)}{r(12, 21, 1, 1, W)}
            {r(27, 19, 1, 5, B)}{r(25, 21, 5, 1, B)}{r(27, 21, 1, 1, W)}
            {/* Big beaming laugh */}
            {r(17, 23, 6, 1, B)}{r(16, 24, 1, 3, B)}{r(17, 24, 6, 3, W)}{r(23, 24, 1, 3, B)}{r(18, 27, 4, 1, B)}
            {/* Celebration starbursts */}
            {r(5, 8, 1, 3, B)}{r(4, 9, 3, 1, B)}
            {r(35, 7, 1, 3, B)}{r(34, 8, 3, 1, B)}
            {r(20, 2, 1, 3, B)}{r(19, 3, 3, 1, B)}
          </g>
        )}

        {emotion === 'tired' && (
          <g className="emotion-tired">
            {/* Drooping arms */}
            {r(5, 28, 2, 3, B)}{r(33, 28, 2, 3, B)}
            {/* Heavy droopy eyelids */}
            {r(10, 21, 5, 1, B)}{r(11, 22, 3, 1, B)}
            {r(25, 21, 5, 1, B)}{r(26, 22, 3, 1, B)}
            {/* Wavy sigh mouth */}
            {r(17, 25, 2, 1, B)}{r(19, 24, 2, 1, B)}{r(21, 25, 2, 1, B)}
            {/* Anime sweat drop */}
            {r(34, 18, 1, 1, B)}{r(33, 19, 3, 1, B)}{r(34, 19, 1, 1, W)}{r(33, 20, 3, 1, B)}{r(34, 20, 1, 1, W)}{r(34, 21, 1, 1, B)}
          </g>
        )}

        {emotion === 'lonely' && (
          <g className="emotion-lonely">
            {/* Arms hugged in shyly */}
            {r(11, 28, 3, 2, B)}{r(26, 28, 3, 2, B)}
            {/* Big wistful eyes looking down */}
            {r(10, 21, 4, 3, B)}{r(10, 21, 1, 1, W)}
            {r(24, 21, 4, 3, B)}{r(24, 21, 1, 1, W)}
            {/* Pout mouth */}
            {r(18, 26, 3, 1, B)}
            {/* Lonely shadow dot */}
            {r(6, 36, 2, 2, DG)}
          </g>
        )}

        {emotion === 'curious' && (
          <g className="emotion-curious">
            {/* Hand tapping helmet */}
            {r(5, 26, 2, 3, B)}
            {r(33, 17, 2, 3, B)}{r(32, 16, 2, 1, B)}
            {/* Asymmetrical eyebrows */}
            {r(10, 18, 3, 1, B)}{r(26, 20, 3, 1, B)}
            {/* One eye wide, one squinted */}
            {r(10, 20, 4, 3, B)}{r(11, 20, 1, 1, W)}
            {r(26, 21, 4, 2, B)}
            {/* Quizzical smirk */}
            {r(17, 25, 2, 1, B)}{r(19, 24, 3, 1, B)}{r(21, 23, 1, 1, B)}
            {/* Floating question mark ? */}
            {r(34, 3, 4, 1, B)}{r(33, 4, 2, 1, B)}{r(37, 4, 2, 1, B)}{r(37, 5, 2, 2, B)}{r(35, 7, 2, 2, B)}{r(35, 10, 2, 2, B)}
          </g>
        )}
      </svg>
    </motion.div>
  );
}
