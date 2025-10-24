function safeEval(expr){
  if (/[^0-9\.\+\-\*\/\(\)\s]/.test(expr)) throw new Error('Unsafe expression');
  const f = new Function(`return (${expr})`);
  return f();
}

export async function solveMathFromText(input){
  if (!input) return { handled:false };
  let text = typeof input === 'string' ? input : (input.combinedText || input.text || '');
  text = text.trim();

  const arithmeticRegex = /([-+]?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)(?:\s*([+\-*/])\s*)([-+]?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)/;
  const eqRegex = /([^=]+)=([^=]+)/;

  let exprText = text.toLowerCase();
  exprText = exprText.replace(/times|multiply by|multiplied by/g, '*')
                     .replace(/divided by|÷/g, '/')
                     .replace(/plus/g, '+').replace(/minus/g, '-')
                     .replace(/ x /g, ' * ');
  exprText = exprText.replace(/(\d+)\s*\/\s*(\d+)/g, '($1/$2)');

  const eqMatch = exprText.match(eqRegex);
  if (eqMatch){
    const left = eqMatch[1].trim(), right = eqMatch[2].trim();
    const solved = trySolveLinear(left, right, 'x');
    if (solved.solved){
      return { handled:true, answer: `x = ${solved.value}`, steps: solved.steps };
    }
    try{
      const lval = safeEval(left), rval = safeEval(right);
      return { handled:true, answer: `Left = ${lval}, Right = ${rval}`, steps:[`Evaluated left: ${lval}`, `Evaluated right: ${rval}`] };
    }catch(e){}
  }

  const arMatch = exprText.match(arithmeticRegex);
  if (arMatch){
    try{
      const aRaw = arMatch[1], op = arMatch[2], bRaw = arMatch[3];
      const aVal = safeEval(aRaw);
      const bVal = safeEval(bRaw);
      let res;
      switch(op){
        case '+': res = aVal + bVal; break;
        case '-': res = aVal - bVal; break;
        case '*': res = aVal * bVal; break;
        case '/': res = bVal === 0 ? Infinity : aVal / bVal; break;
      }
      const steps = [
        `Parsed operands: ${aRaw} => ${aVal}, ${bRaw} => ${bVal}`,
        `Operation: ${aVal} ${op} ${bVal} = ${res}`
      ];
      return { handled:true, answer: `Answer: ${res}`, steps };
    }catch(e){}
  }

  const wp = trySolveWordProblem(exprText);
  if (wp.handled) return wp;

  return { handled:false };
}

function trySolveLinear(left, right, variable='x'){
  const parseSide = (s) => {
    let str = s.replace(/\s+/g,'');
    str = str.replace(/(?!^)-/g,'+-');
    const parts = str.split('+').filter(Boolean);
    let coeff = 0, constant = 0;
    for (const term of parts){
      if (term.includes(variable)){
        const coef = term.replace(variable,'');
        if (coef === '' || coef === '+') coeff += 1;
        else if (coef === '-') coeff += -1;
        else coeff += parseFloat(coef);
      } else {
        const v = parseFloat(term);
        if (!isNaN(v)) constant += v;
      }
    }
    return { coeff, constant };
  };
  try{
    const L = parseSide(left), R = parseSide(right);
    const A = L.coeff - R.coeff;
    const B = R.constant - L.constant;
    if (A === 0) return { solved:false };
    const val = B / A;
    const steps = [
      `Parsed left: coeff=${L.coeff}, const=${L.constant}`,
      `Parsed right: coeff=${R.coeff}, const=${R.constant}`,
      `Solve ${A}*x = ${B} -> x = ${B}/${A} = ${val}`
    ];
    return { solved:true, value: val, steps };
  }catch(e){ return { solved:false }; }
}

function trySolveWordProblem(text){
  const nums = Array.from(text.matchAll(/-?\d+(?:\.\d+)?/g)).map(m=>parseFloat(m[0]));
  if (nums.length >= 2){
    if (text.includes('sum of') || text.includes('add') || text.includes('plus') || text.includes('total')){
      const s = nums.reduce((a,b)=>a+b,0);
      return { handled:true, answer:`Answer: ${s}`, steps:[`Numbers: ${nums.join(', ')}`, `Sum = ${s}`] };
    }
    if (text.includes('difference') || text.includes('minus') || text.includes('less')){
      const diff = nums.reduce((a,b)=>a-b);
      return { handled:true, answer:`Answer: ${diff}`, steps:[`Numbers: ${nums.join(', ')}`, `Difference = ${diff}`] };
    }
    if (text.includes('product') || text.includes('times') || text.includes('multiply')){
      const p = nums.reduce((a,b)=>a*b,1);
      return { handled:true, answer:`Answer: ${p}`, steps:[`Numbers: ${nums.join(', ')}`, `Product = ${p}`] };
    }
    if (text.includes('divide') || text.includes('quotient') || text.includes('divided')){
      const q = nums.slice(1).reduce((a,b)=>a/b, nums[0]);
      return { handled:true, answer:`Answer: ${q}`, steps:[`Numbers: ${nums.join(', ')}`, `Quotient = ${q}`] };
    }
  }
  const fracMatch = text.match(/(\d+\s*\/\s*\d+)/g);
  if (fracMatch && fracMatch.length >= 2){
    try{
      const vals = fracMatch.map(f => { const [n,d] = f.split('/').map(s=>parseFloat(s.trim())); return n/d; });
      const sum = vals.reduce((a,b)=>a+b,0);
      return { handled:true, answer:`Answer: ${sum}`, steps:[`Fractions: ${fracMatch.join(', ')}`, `Sum = ${sum}`] };
    }catch(e){}
  }
  return { handled:false };
}
