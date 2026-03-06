export const createMainScaleTexture = () => {
  const canvas = document.createElement('canvas');
  const width = 2048;
  const height = 256;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#e5e7eb'; // Zinc-200 like
  ctx.fillRect(0, 0, width, height);

  // Ticks
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const totalMM = 160; // 16cm
  const pixelsPerMM = width / totalMM;

  for (let i = 0; i <= totalMM; i++) {
    const x = i * pixelsPerMM;
    let tickHeight = 20;
    
    if (i % 10 === 0) {
      tickHeight = 50;
      // Draw number
      if (i > 0) {
        ctx.fillText((i / 10).toString(), x, 60);
      }
    } else if (i % 5 === 0) {
      tickHeight = 35;
    }

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, tickHeight);
    ctx.stroke();
  }

  return canvas;
};

export const createVernierScaleTexture = () => {
  const canvas = document.createElement('canvas');
  const width = 512;
  const height = 128;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#d1d5db'; // Zinc-300
  ctx.fillRect(0, 0, width, height);

  // Ticks
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // 0.05mm precision means 20 divisions.
  // Standard metric vernier: 20 divisions span 19mm or 39mm.
  // Let's use 19mm for compact standard.
  // So total width in mm represented by texture = 19mm (plus margins).
  // Actually, let's map the texture exactly to the 20 divisions.
  
  const divisions = 20;
  const totalLengthMM = 19; 
  const pixelsPerMM = width / (totalLengthMM + 2); // Add some padding
  const startX = pixelsPerMM * 1; // Start 1mm in

  for (let i = 0; i <= divisions; i++) {
    // Distance of each tick is 19/20 = 0.95mm
    const x = startX + (i * (19 / 20)) * pixelsPerMM;
    
    let tickHeight = 20;
    if (i % 10 === 0) {
      tickHeight = 40;
      ctx.fillText(i === 20 ? '10' : (i/2).toString(), x, height - 45);
    } else if (i % 2 === 0) {
      // tickHeight = 30; // Optional mid tick
    }

    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x, height - tickHeight);
    ctx.stroke();
  }
  
  // Label
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText("0.05mm", width - 50, 30);

  return canvas;
};
