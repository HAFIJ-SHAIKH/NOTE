import { processImage } from './modules/ocr.js';
import { solveMathFromText } from './modules/mathSolver.js';
import { getResponse } from './modules/conversation.js';
import { clampImageFile, cleanText } from './modules/utils.js';

const textInput = document.getElementById('textInput');
const imageInput = document.getElementById('imageInput');
const sendBtn = document.getElementById('sendBtn');
const chat = document.getElementById('chat');

function showMessage(text, from = 'bot', meta = ''){
  const el = document.createElement('div');
  el.className = `msg ${from === 'user' ? 'user' : 'bot'}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  el.appendChild(bubble);
  if (meta){
    const m = document.createElement('span');
    m.className = 'meta';
    m.textContent = meta;
    el.appendChild(m);
  }
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

async function handleTextInput(raw){
  const text = cleanText(raw);
  showMessage(raw, 'user');

  try{
    const mathResult = await solveMathFromText(text);
    if (mathResult && mathResult.handled) {
      showMessage(mathResult.answer, 'bot', (mathResult.steps ? mathResult.steps.join(' | ') : ''));
      return;
    }
  }catch(e){
    console.error('Math error', e);
  }

  try{
    const reply = await getResponse(text);
    showMessage(reply, 'bot');
  }catch(e){
    console.error('Conversation engine error', e);
    showMessage('Sorry, an internal error occurred.', 'bot');
  }
}

async function handleImageFile(file){
  const safeFile = await clampImageFile(file, 2_000_000);
  showMessage('[Image uploaded]', 'user');
  try{
    const result = await processImage(safeFile);
    if ((!result.text || result.text.trim().length === 0) && (!result.symbols || result.symbols.length === 0)){
      showMessage('Could not read text or symbols from the image. Try a clearer picture.', 'bot');
      return;
    }

    const combined = (result.structured && result.structured.combinedText) ? result.structured.combinedText : (result.text || '');
    showMessage(combined, 'bot', `OCR confidence: ${result.confidence || 0}%`);

    if (result.autoSolved && result.autoSolved.handled){
      const ans = result.autoSolved.answer || 'Solved';
      const steps = result.autoSolved.steps ? result.autoSolved.steps.join(' | ') : '';
      showMessage(ans, 'bot', steps);
      return;
    }

    const mathResult = await solveMathFromText(result.structured ? result.structured : (result.text || ''));
    if (mathResult && mathResult.handled){
      showMessage(mathResult.answer, 'bot', (mathResult.steps ? mathResult.steps.join(' | ') : ''));
      return;
    }

    const reply = await getResponse(combined || result.text);
    showMessage(reply, 'bot');
  }catch(err){
    console.error(err);
    showMessage('Error processing image. See console for details.', 'bot');
  }
}

sendBtn.addEventListener('click', async ()=>{
  const text = textInput.value.trim();
  const file = imageInput.files && imageInput.files[0];
  if (file){
    await handleImageFile(file);
    imageInput.value = '';
  } else if (text){
    await handleTextInput(text);
    textInput.value = '';
  }
});

textInput.addEventListener('keydown', async (e)=>{
  if (e.key === 'Enter') { e.preventDefault(); sendBtn.click(); }
});

window.NoteIntegration = {
  showMessage,
  handleTextInput,
  handleImageFile
};
