import database from './database_large.json' assert { type: 'json' };

const session = { history: [], contextMemory: [] };

export async function getResponse(raw){
  if (!raw) return database['default'] || "I'm still learning.";
  const text = raw.toLowerCase().trim();
  session.history.push(text);

  if (database[text]) return database[text];

  if (/^(hi|hello|hey)\b/.test(text)) return database['hello'];
  if (text.includes('your name')) return database['what is your name'];
  if (text.includes('how are you')) return database['how are you'];

  const keys = Object.keys(database).sort((a,b)=>b.length - a.length);
  for (const k of keys){
    if (k.length > 3 && text.includes(k)) return database[k];
  }

  if (session.history.length >= 2){
    const prev = session.history[session.history.length-2];
    if (prev.includes('solve') && text.includes('explain')){
      return "Sure — I can explain the steps. Which part do you want clarified?";
    }
  }

  session.contextMemory.push(text);
  if (session.contextMemory.length > 50) session.contextMemory.shift();

  return database['default'] || "I'm still learning. Try rephrasing or ask a math/image question.";
}
