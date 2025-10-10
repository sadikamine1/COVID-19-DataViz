import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Menu: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = [
    { to: '/covid', label: 'COVID-19', color: '#ff4d4f', icon: '🦠' },
    { to: '/flu', label: 'Influenza (Flu)', color: '#d97706', icon: '🤧' },
    { to: '/measles', label: 'Measles (Rougeole)', color: '#f43f5e', icon: '🔴' },
    { to: '/malaria', label: 'Malaria (Paludisme)', color: '#22c55e', icon: '🦟' },
    { to: '/tuberculosis', label: 'Tuberculosis (TB)', color: '#8b5cf6', icon: '🫁' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1825 50%, #1a2332 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 40%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(80px)',
          animation: 'floatBackground 20s ease-in-out infinite',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(70px)',
          animation: 'floatBackground2 25s ease-in-out infinite',
          zIndex: 0,
        }}
      />
      
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            width: `${3 + Math.random() * 6}px`,
            height: `${3 + Math.random() * 6}px`,
            background: `rgba(${100 + Math.random() * 155}, ${150 + Math.random() * 105}, 255, ${0.15 + Math.random() * 0.35})`,
            borderRadius: '50%',
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
            animation: `floatParticle${i % 4} ${12 + Math.random() * 15}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            filter: 'blur(1px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}

      <div style={{ width: 'min(1100px, 94vw)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1
            style={{
              margin: 0,
              marginBottom: 12,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: '#e3f2ff',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              textShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
              animation: 'fadeInDown 0.8s ease-out',
            }}
          >
            Global Disease Dashboard
          </h1>
          <p
            style={{
              color: '#a8c5e8',
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              animation: 'fadeInUp 0.8s ease-out 0.2s both',
            }}
          >
            Explore data, trends, and insights for major global diseases
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 20,
          }}
        >
          {items.map((it, idx) => (
            <Link
              key={it.to}
              to={it.to}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '28px 20px',
                background: hoveredIndex === idx
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(20, 30, 48, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
                border: `1px solid ${hoveredIndex === idx ? it.color : 'rgba(59, 130, 246, 0.2)'}`,
                borderRadius: 16,
                color: '#e3efff',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredIndex === idx ? 'scale(1.02)' : 'scale(1)',
                boxShadow: hoveredIndex === idx
                  ? `0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px ${it.color}30`
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)',
                animation: `fadeInCard 0.6s ease-out ${idx * 0.1}s both`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${it.color}20, transparent)`,
                  transition: 'left 0.5s',
                  pointerEvents: 'none',
                  ...(hoveredIndex === idx && { left: '100%' }),
                }}
              />

              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: 12,
                  transform: hoveredIndex === idx ? 'scale(1.2) rotate(5deg)' : 'scale(1) rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: hoveredIndex === idx ? `drop-shadow(0 0 12px ${it.color})` : 'none',
                }}
              >
                {it.icon}
              </div>

              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  marginBottom: 8,
                  textAlign: 'center',
                  color: hoveredIndex === idx ? it.color : '#e3efff',
                  transition: 'color 0.3s',
                }}
              >
                {it.label}
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  color: hoveredIndex === idx ? '#a8c5e8' : '#7a8fa8',
                  transition: 'color 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                View Dashboard
                <span
                  style={{
                    display: 'inline-block',
                    transform: hoveredIndex === idx ? 'translateX(4px)' : 'translateX(0)',
                    transition: 'transform 0.3s',
                  }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#6b8099',
            animation: 'fadeIn 1s ease-out 0.8s both',
          }}
        >
          Data-driven insights • Real-time visualization • Interactive exploration
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInCard {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes floatParticle0 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(40px, -60px) scale(1.2);
            opacity: 0.7;
          }
          50% {
            transform: translate(-30px, 50px) scale(0.8);
            opacity: 0.4;
          }
          75% {
            transform: translate(50px, 30px) scale(1.1);
            opacity: 0.6;
          }
        }

        @keyframes floatParticle1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          33% {
            transform: translate(-50px, 70px) scale(1.3);
            opacity: 0.8;
          }
          66% {
            transform: translate(60px, -40px) scale(0.9);
            opacity: 0.5;
          }
        }

        @keyframes floatParticle2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.35;
          }
          50% {
            transform: translate(35px, 80px) scale(1.15) rotate(180deg);
            opacity: 0.75;
          }
        }

        @keyframes floatParticle3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(-60px, -50px) scale(0.85);
            opacity: 0.5;
          }
          50% {
            transform: translate(45px, 60px) scale(1.25);
            opacity: 0.8;
          }
          75% {
            transform: translate(-40px, 35px) scale(1.05);
            opacity: 0.6;
          }
        }

        @keyframes floatBackground {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(30vw, -20vh) scale(1.1);
          }
          50% {
            transform: translate(-20vw, 30vh) scale(0.9);
          }
          75% {
            transform: translate(25vw, 15vh) scale(1.05);
          }
        }

        @keyframes floatBackground2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-25vw, 25vh) scale(1.15);
          }
          66% {
            transform: translate(20vw, -30vh) scale(0.85);
          }
        }
      `}</style>
    </div>
  );
};

export default Menu;
