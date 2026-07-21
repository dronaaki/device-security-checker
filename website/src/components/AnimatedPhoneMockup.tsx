import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, Cpu } from 'lucide-react';

export function AnimatedPhoneMockup() {
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position values for 3D tilt interactive response
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for fluid 3D tilt reaction
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  // Transform mouse coordinates into subtle 3D rotational degrees (max +/- 12 deg)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-12, 12]);
  const glowX = useTransform(mouseX, [-0.5, 0.5], ['30%', '70%']);
  const glowY = useTransform(mouseY, [-0.5, 0.5], ['30%', '70%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate normalized coordinates from -0.5 to +0.5
    const normalizedX = (e.clientX - rect.left) / width - 0.5;
    const normalizedY = (e.clientY - rect.top) / height - 0.5;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{
        perspective: '1200px',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        padding: '20px 0'
      }}
    >
      {/* Background Animated Neural Glow Aura */}
      <motion.div
        animate={{
          scale: isHovered ? [1, 1.15, 1.08] : [1, 1.08, 1],
          opacity: isHovered ? [0.35, 0.6, 0.45] : [0.15, 0.28, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '85%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(139,92,246,0.3) 50%, rgba(0,0,0,0) 75%)',
          filter: 'blur(70px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main 3D Animated Container (Entrance + Idle Float + Interactive 3D Tilt) */}
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.9, rotateX: 15 }}
        animate={{
          opacity: 1,
          y: [0, -12, 0], // Gentle Idle Floating Bounce
          scale: isHovered ? 1.03 : 1
        }}
        transition={{
          opacity: { duration: 1, ease: 'easeOut' },
          scale: { duration: 0.3, ease: 'easeOut' },
          y: {
            duration: 5,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut'
          }
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1,
          willChange: 'transform'
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Outer Glowing Cyber Frame Effect */}
        <div
          style={{
            position: 'relative',
            borderRadius: '36px',
            padding: '4px',
            background: isHovered
              ? 'linear-gradient(135deg, rgba(6,182,212,0.8), rgba(139,92,246,0.8), rgba(6,182,212,0.4))'
              : 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
            boxShadow: isHovered
              ? '0 30px 60px -12px rgba(6, 182, 212, 0.4), 0 0 40px rgba(139, 92, 246, 0.3)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            transition: 'background 0.4s ease, box-shadow 0.4s ease'
          }}
        >
          {/* Main Hero Graphic Image */}
          <div style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', background: '#000' }}>
            <img
              src="/hero.png"
              alt="Unhackme Threat Scanner Mockup"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '32px',
                filter: isHovered ? 'brightness(1.06) contrast(1.04)' : 'brightness(1)',
                transition: 'filter 0.3s ease'
              }}
            />

            {/* AI Futuristic Laser Scanning Beam Line Effect */}
            <motion.div
              animate={{
                top: ['-10%', '110%']
              }}
              transition={{
                duration: isHovered ? 2 : 3.5,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.9) 30%, rgba(255, 255, 255, 1) 50%, rgba(139, 92, 246, 0.9) 70%, transparent 100%)',
                boxShadow: '0 0 15px 3px rgba(6, 182, 212, 0.8), 0 0 30px 6px rgba(139, 92, 246, 0.5)',
                pointerEvents: 'none',
                zIndex: 2
              }}
            />

            {/* Interactive Dynamic Glass Light Reflection Overlay */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at ${glowX.get()} ${glowY.get()}, rgba(255,255,255,0.18) 0%, transparent 60%)`,
                pointerEvents: 'none',
                zIndex: 3
              }}
            />
          </div>

          {/* Floating Interactive Badge #1: AI Neural Protection Status */}
          <motion.div
            animate={{
              y: isHovered ? [-4, 4, -4] : [0, 0, 0],
              scale: isHovered ? 1.05 : 1
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '12%',
              left: '-24px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(6, 182, 212, 0.5)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.4), 0 0 15px rgba(6, 182, 212, 0.3)',
              padding: '10px 16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f8fafc',
              zIndex: 4,
              pointerEvents: 'none'
            }}
          >
            <div style={{ background: 'rgba(6, 182, 212, 0.2)', padding: '6px', borderRadius: '50%' }}>
              <ShieldCheck size={20} color="#06b6d4" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Neural Shield
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                Real-Time Threat Scan Active
              </div>
            </div>
          </motion.div>

          {/* Floating Interactive Badge #2: Zero-Day Protection Indicator */}
          <motion.div
            animate={{
              y: isHovered ? [4, -4, 4] : [0, 0, 0],
              scale: isHovered ? 1.05 : 1
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              bottom: '15%',
              right: '-24px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.4), 0 0 15px rgba(139, 92, 246, 0.3)',
              padding: '10px 16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f8fafc',
              zIndex: 4,
              pointerEvents: 'none'
            }}
          >
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '6px', borderRadius: '50%' }}>
              <Cpu size={20} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Zero-Day Defense
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                0 Threats Found • Secure
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
