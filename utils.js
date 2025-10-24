export async function clampImageFile(file, maxBytes = 2_000_000){
  if (!file) return file;
  if (file.size <= maxBytes) return file;

  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let scale = 0.9;
  let quality = 0.9;
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  for (let i=0;i<6;i++){
    const blob = await canvasToBlob(canvas, quality);
    if (blob.size <= maxBytes) return new File([blob], file.name, { type: blob.type });
    scale *= 0.8;
    quality *= 0.85;
    canvas.width = Math.max(200, img.width * scale);
    canvas.height = Math.max(200, img.height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  return file;
}

function fileToImage(file){
  return new Promise((resolve, reject)=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{ URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

function canvasToBlob(canvas, quality=0.9){
  return new Promise((resolve)=>{
    canvas.toBlob((b)=>resolve(b), 'image/jpeg', quality);
  });
}

export function cleanText(t){
  if (!t) return '';
  return String(t).replace(/\s+/g, ' ').trim();
}
