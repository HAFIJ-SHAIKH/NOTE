// Full expanded symbols.js (heuristic detector + TF stub)
// (Content from prior message - full helper implementations included)
export async function loadTFModel(modelUrl){
  if (!modelUrl) return null;
  if (typeof tf === 'undefined'){ console.warn('TF.js not detected in page. Please include TF.js to use ML model.'); return null; }
  try{
    try { return await tf.loadGraphModel(modelUrl); } catch(e) { return await tf.loadLayersModel(modelUrl); }
  }catch(e){ console.error('Failed to load model URL:', modelUrl, e); return null; }
}

export async function detectSymbols(canvas, model = null){
  if (model && typeof model.execute === 'function' && typeof tf !== 'undefined'){
    try{
      const out = await detectWithModel(canvas, model);
      if (out && out.length) return out;
    }catch(e){
      console.warn('ML detection failed:', e);
    }
  }
  return heuristicDetect(canvas);
}

function heuristicDetect(canvas){
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const imageData = ctx.getImageData(0,0,w,h).data;
  const gray = new Uint8ClampedArray(w*h);
  for (let i=0,p=0;i<imageData.length;i+=4,p++){
    gray[p] = Math.round(0.299*imageData[i] + 0.587*imageData[i+1] + 0.114*imageData[i+2]);
  }
  let sum=0; for (let i=0;i<gray.length;i++) sum += gray[i];
  const avg = sum / gray.length;
  const thr = Math.max(55, Math.min(200, Math.round(avg * 0.9)));
  const bin = new Uint8Array(w*h);
  for (let i=0;i<gray.length;i++) bin[i] = gray[i] < thr ? 1 : 0;
  const comps = connectedComponents(bin, w, h);
  const dets = [];
  for (const c of comps){
    if (c.area < 30) continue;
    const box = { x: c.minX, y: c.minY, w: c.maxX - c.minX + 1, h: c.maxY - c.minY + 1 };
    const patch = extractPatch(bin, w, h, box);
    const strokes = analyzeStrokes(patch, box.w, box.h);
    const perimeter = approximatePerimeter(c.pixels, w, h);
    const circ = perimeter > 0 ? (4*Math.PI*c.area)/(perimeter*perimeter) : 0;
    const aspect = box.w / box.h;
    let label = 'unknown'; let score = 0.6;
    if (strokes.isPlus) { label = '+'; score = 0.92; }
    else if (strokes.isMinus) { label = '-'; score = 0.92; }
    else if (strokes.isEquals) { label = '='; score = 0.92; }
    else if (strokes.isMultiply) { label = '×'; score = 0.88; }
    else if (strokes.isDivision) { label = '÷'; score = 0.85; }
    else if (circ > 0.5 && aspect > 0.6 && aspect < 1.6){ label = 'circle'; score = 0.86; }
    else if (aspect > 3 || aspect < 0.33){ label = 'line'; score = 0.66; }
    else if (isTriangleApprox(patch, box.w, box.h)) { label = 'triangle'; score = 0.78; }
    else if (aspect > 0.85 && aspect < 1.25 && circ < 0.3) { label = 'square'; score = 0.78; }
    dets.push({ label, bbox: box, score, area: c.area, circ });
  }
  const arrows = detectArrows(dets, bin, w, h);
  return dets.concat(arrows);
}

// helper functions below: connectedComponents, extractPatch, analyzeStrokes, findPeaks, diagSum,
// approximatePerimeter, isTriangleApprox, detectArrows, massInRect, detectWithModel

function connectedComponents(bin, w, h){
  const label = new Int32Array(w*h).fill(0);
  let next = 1;
  const comps = {};
  const idx = (x,y) => y*w + x;
  for (let y=0;y<h;y++){
    for (let x=0;x<w;x++){
      const i = idx(x,y);
      if (!bin[i] || label[i]) continue;
      const stack = [i]; label[i]=next; comps[next] = { pixels:[], minX:x, maxX:x, minY:y, maxY:y, area:0 };
      while(stack.length){
        const p = stack.pop();
        const px = p % w, py = Math.floor(p / w);
        const c = comps[next];
        c.pixels.push(p); c.area++;
        if (px < c.minX) c.minX = px;
        if (px > c.maxX) c.maxX = px;
        if (py < c.minY) c.minY = py;
        if (py > c.maxY) c.maxY = py;
        if (px>0){
          const n=p-1;
          if (bin[n] && !label[n]) { label[n]=next; stack.push(n); }
        }
        if (px<w-1){
          const n=p+1;
          if (bin[n] && !label[n]) { label[n]=next; stack.push(n); }
        }
        if (py>0){
          const n=p-w;
          if (bin[n] && !label[n]) { label[n]=next; stack.push(n); }
        }
        if (py<h-1){
          const n=p+w;
          if (bin[n] && !label[n]) { label[n]=next; stack.push(n); }
        }
      }
      next++;
    }
  }
  const out=[];
  for (let k=1;k<next;k++) out.push(comps[k]);
  return out;
}

function extractPatch(bin, w, h, box){
  const arr = new Uint8Array(box.w * box.h);
  for (let yy=0; yy<box.h; yy++){
    for (let xx=0; xx<box.w; xx++){
      const sx = box.x + xx, sy = box.y + yy;
      arr[yy*box.w + xx] = bin[sy*w + sx];
    }
  }
  return arr;
}

function analyzeStrokes(patch, pw, ph){
  const rowSum = new Array(ph).fill(0);
  const colSum = new Array(pw).fill(0);
  for (let y=0;y<ph;y++){
    for (let x=0;x<pw;x++){
      const v = patch[y*pw + x] || 0;
      rowSum[y] += v; colSum[x] += v;
    }
  }
  const maxRow = Math.max(...rowSum), maxCol = Math.max(...colSum);
  const centerY = Math.floor(ph/2), centerX = Math.floor(pw/2);
  const isMinus = (rowSum[centerY] > 0.6*maxRow) && (maxCol < 0.45*maxRow);
  const isPlus = (rowSum[centerY] > 0.45*maxRow) && (colSum[centerX] > 0.45*maxCol);
  const peaks = findPeaks(rowSum, Math.max(1, Math.floor(ph/8)));
  const isEquals = peaks.length >= 2 && Math.abs(peaks[0] - peaks[1]) > Math.max(1, Math.floor(ph/6));
  const diag1 = diagSum(patch, pw, ph, true), diag2 = diagSum(patch, pw, ph, false);
  const isMultiply = (diag1 > 0.2*maxRow && diag2 > 0.2*maxRow) && !isPlus;
  const dotAbove = rowSum.slice(0, Math.floor(ph/3)).some(v=>v > 0.45*maxRow);
  const slashLine = colSum.some(v=>v > 0.45*maxCol);
  const isDivision = dotAbove && slashLine && !isMultiply;
  return { isPlus, isMinus, isEquals, isMultiply, isDivision, rowSum, colSum };
}

function findPeaks(arr, minSep=2){
  const peaks=[];
  for (let i=1;i<arr.length-1;i++) if (arr[i] > arr[i-1] && arr[i] >= arr[i+1]) peaks.push(i);
  const out = peaks.length ? [peaks[0]] : [];
  for (let i=1;i<peaks.length;i++) if (Math.abs(peaks[i] - out[out.length-1]) >= minSep) out.push(peaks[i]);
  return out;
}

function diagSum(patch, pw, ph, main=true){
  let s=0; const n = Math.min(pw, ph);
  for (let i=0;i<n;i++){ const x = main ? i : (pw-1-i); const y=i; s += patch[y*pw + x] || 0; }
  return s;
}

function approximatePerimeter(pixels, w, h){
  const S = new Set(pixels); let per=0;
  for (const p of pixels){
    if (!S.has(p-1)) per++; if (!S.has(p+1)) per++; if (!S.has(p-w)) per++; if (!S.has(p+w)) per++;
  }
  return per;
}

function isTriangleApprox(patch, pw, ph){
  const rowSum = new Array(ph).fill(0);
  for (let y=0;y<ph;y++) for (let x=0;x<pw;x++) rowSum[y] += patch[y*pw + x] || 0;
  const maxRow = Math.max(...rowSum); const maxIdx = rowSum.indexOf(maxRow);
  if (maxIdx < Math.floor(ph*0.4)) return false;
  for (let y=0;y<maxIdx;y++){ if (rowSum[y] < rowSum[y+1] - 4) return false; }
  return true;
}

function detectArrows(dets, bin, w, h){
  const out=[]; for (const d of dets){
    if (d.label === 'line' || d.label === 'unknown'){
      const box = d.bbox; const sample = Math.min(12, Math.max(6, Math.floor(Math.min(box.w, box.h) * 0.2)));
      const leftX = Math.max(0, box.x - sample); const rightX = Math.min(w-1, box.x + box.w + sample);
      const leftMass = massInRect(bin, w, h, leftX, box.y, sample, box.h);
      const rightMass = massInRect(bin, w, h, rightX - sample, box.y, sample, box.h);
      if (leftMass > box.area * 0.05) out.push({ label:'arrow', bbox:{x:leftX, y:box.y, w:sample, h:box.h}, score:0.62 });
      if (rightMass > box.area * 0.05) out.push({ label:'arrow', bbox:{x:rightX - sample, y:box.y, w:sample, h:box.h}, score:0.62 });
    }
  } return out;
}

function massInRect(bin, w, h, x, y, bw, bh){
  let s=0; for (let yy=Math.max(0,y); yy<Math.min(h,y+bh); yy++) for (let xx=Math.max(0,x); xx<Math.min(w,x+bw); xx++) s += bin[yy*w + xx];
  return s;
}

async function detectWithModel(canvas, model){
  if (typeof tf === 'undefined') return [];
  const inputSize = 320;
  const tmp = document.createElement('canvas'); tmp.width = inputSize; tmp.height = inputSize;
  tmp.getContext('2d').drawImage(canvas, 0, 0, inputSize, inputSize);
  const imgData = tmp.getContext('2d').getImageData(0,0,inputSize,inputSize);
  const data = new Float32Array(inputSize * inputSize * 3);
  let di=0;
  for (let i=0;i<imgData.data.length;i+=4){
    data[di++] = imgData.data[i] / 255; data[di++] = imgData.data[i+1] / 255; data[di++] = imgData.data[i+2] / 255;
  }
  const tensor = tf.tensor4d(data, [1, inputSize, inputSize, 3]);
  try{
    const preds = await model.executeAsync(tensor);
    tf.dispose(tensor);
    return [];
  }catch(e){
    console.error('Model inference error', e);
    tf.dispose(tensor);
    return [];
  }
}

export default { loadTFModel, detectSymbols };
