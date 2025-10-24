import { detectSymbols, loadTFModel } from './symbols.js';
import { solveMathFromText } from './mathSolver.js';

const SYMBOL_MODEL_URL = '/models/symbol_model/model.json';
let symbolModel = null;
(async ()=>{
  if (SYMBOL_MODEL_URL){
    symbolModel = await loadTFModel(SYMBOL_MODEL_URL);
  }
})();

export async function processImage(file){
  const img = await fileToImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxDim = 1400;
  let { width, height } = img;
  if (Math.max(width, height) > maxDim){
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  canvas.width = width; canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  const id = ctx.getImageData(0,0,width,height);
  const d = id.data;
  const contrast = 1.08;
  for (let i=0;i<d.length;i+=4){
    let lum = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
    lum = ((lum - 128) * contrast) + 128;
    lum = Math.max(0, Math.min(255, lum));
    d[i]=d[i+1]=d[i+2]=lum;
  }
  ctx.putImageData(id,0,0);

  let ocrText = '';
  let ocrConfidence = 0;
  if (typeof Tesseract !== 'undefined'){
    try{
      const worker = Tesseract.createWorker({ logger: ()=>{} });
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(canvas);
      await worker.terminate();
      ocrText = (data && data.text) ? data.text.trim() : '';
      if (data && Array.isArray(data.words) && data.words.length){
        const avg = data.words.reduce((s,w)=>s+(w.confidence||0),0)/data.words.length;
        ocrConfidence = Math.round(avg);
      } else {
        ocrConfidence = data && data.confidence ? Math.round(data.confidence) : 0;
      }
    }catch(e){
      console.warn('Tesseract failed', e);
      ocrText = '';
      ocrConfidence = 0;
    }
  }

  let symbols = [];
  try{ symbols = await detectSymbols(canvas, symbolModel); }catch(e){ console.warn(e); symbols = []; }

  const structured = mergeTextSymbols(ocrText, symbols);

  let autoSolved = null;
  try{
    const mathRes = await solveMathFromText(structured.combinedText || ocrText || '');
    if (mathRes && mathRes.handled) autoSolved = mathRes;
  }catch(e){ console.warn('auto-solve failed', e); }

  return { text: ocrText, confidence: ocrConfidence, symbols, structured, autoSolved };
}

function mergeTextSymbols(ocrText, symbols){
  const items = [];
  const lines = (ocrText || '').split('\n').map(l=>l.trim()).filter(Boolean);
  for (const l of lines) items.push({ type:'text', text:l });
  for (const s of symbols) items.push({ type:'symbol', label:s.label, bbox:s.bbox, score:s.score });

  const txts = lines.slice();
  for (const s of symbols){
    if (['+','-','=','×','÷'].includes(s.label)) txts.push(s.label);
    else if (s.label === 'arrow') txts.push('->');
    else if (s.label === 'circle') txts.push('(circle)');
    else txts.push('['+s.label+']');
  }
  return { combinedText: txts.join(' '), items };
}

function fileToImage(file){
  return new Promise((resolve,reject)=>{
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{ URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}
