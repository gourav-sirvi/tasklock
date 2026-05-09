import React, { useEffect, useRef } from 'react';

const LiveWallpaper = ({ theme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Resize
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Particles
    const particles = [];
    const particleCount = theme === 'dark' ? 150 : 100; // More particles for snow/embers
    
    for(let i=0; i<particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: theme === 'dark' ? Math.random() * 2 + 0.5 : Math.random() * 4 + 2, // Small embers vs larger petals
        speedX: theme === 'dark' ? Math.random() * 1 - 0.5 : Math.random() * 2 - 1,
        speedY: theme === 'dark' ? Math.random() * -2 - 0.5 : Math.random() * 2 + 1, // Embers float up, petals fall down
        // Embers (red/orange) for dark, Wisteria petals (purple/pink) for light
        color: theme === 'dark' 
          ? `rgba(239, 68, 68, ${Math.random() * 0.8 + 0.2})` 
          : `rgba(168, 85, 247, ${Math.random() * 0.6 + 0.4})`
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        ctx.beginPath();
        // Embers are simple circles, petals can be slight ovals
        if (theme === 'light') {
          ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.6, p.x * 0.01, 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        }
        
        ctx.fillStyle = p.color;
        // Add glow for dark mode embers
        if (theme === 'dark') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Reset logic based on direction
        if (theme === 'dark' && p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        } else if (theme === 'light' && p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        
        // Side wrap
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
      });
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 0 
      }} 
    />
  );
};

export default LiveWallpaper;
