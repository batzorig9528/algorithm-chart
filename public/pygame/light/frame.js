(() => {
  const channel = 'flow-pygame-v1', runId = location.hash.slice(1);
  const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
  const base = new URL('./', location.href).href;
  const bootstrap = `self.FLOW_BASE=${JSON.stringify(base)};importScripts(self.FLOW_BASE+'worker.js');`;
  const url = URL.createObjectURL(new Blob([bootstrap], { type: 'text/javascript' }));
  let worker, running = false, terminal = false;
  const send = message => parent.postMessage({ ...message, channel, runId }, '*');
  const stop = () => { worker?.terminate(); terminal = true; URL.revokeObjectURL(url); };
  const fail = text => { if (!terminal) { send({ type: 'error', text }); stop(); } };
  const number = value => { if (typeof value !== 'number' || !Number.isFinite(value)) throw Error('Зургийн координат тоо байх ёстой.'); return value; };
  const color = value => {
    if (typeof value === 'string') return value;
    if (!Array.isArray(value) || value.length < 3) throw Error('Өнгө (r, g, b) байна.');
    return `rgb(${value.slice(0, 3).map(n => Math.max(0, Math.min(255, number(n)))).join(',')})`;
  };
  function draw([name, args]) {
    if (name === 'size') { canvas.width = Math.min(1280, number(args[0])); canvas.height = Math.min(720, number(args[1])); return; }
    if (name === 'caption') { document.title = String(args[0]); return; }
    if (name === 'quit') { keys = {}; return; }
    if (name === 'fill') { ctx.fillStyle = color(args[0]); ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
    if (name === 'text') { ctx.fillStyle = color(args[2]); ctx.font = `${number(args[3])}px sans-serif`; ctx.textBaseline = 'top'; ctx.fillText(String(args[0]).slice(0, 4000), number(args[1][0]), number(args[1][1])); return; }
    ctx.fillStyle = ctx.strokeStyle = color(args[0]);
    ctx.beginPath();
    let width = 0;
    if (name === 'rect') { const [x,y,w,h] = args[1].map(number); ctx.rect(x,y,w,h); width = args[2]; }
    else if (name === 'circle') { ctx.arc(number(args[1][0]),number(args[1][1]),Math.max(0,number(args[2])),0,Math.PI*2); width=args[3]; }
    else if (name === 'line') { ctx.moveTo(...args[1].map(number)); ctx.lineTo(...args[2].map(number)); width=args[3] || 1; }
    else if (name === 'ellipse') { const [x,y,w,h] = args[1].map(number); ctx.ellipse(x+w/2,y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,Math.PI*2); width=args[2]; }
    else if (name === 'polygon') { if(args[1].length>2000)throw Error('Оройн тоо хэт олон.'); args[1].forEach((p,i)=> i?ctx.lineTo(...p.map(number)):ctx.moveTo(...p.map(number)));ctx.closePath();width=args[2]; }
    else throw Error('Дэмжигдэхгүй зурах үйлдэл: '+name);
    if (number(width)>0) { ctx.lineWidth=width;ctx.stroke(); } else ctx.fill();
  }
  try { worker = new Worker(url); } catch (e) { fail('Хөнгөн Python worker нээгдсэнгүй: '+e.message); return; }
  worker.onerror = event => { event.preventDefault(); fail('Python ачаалж чадсангүй: '+event.message); };
  worker.onmessage = event => {
    if (terminal) return;
    const message = event.data;
    if (message.type === 'draw') { try { message.commands.forEach(draw); } catch(e) { fail(e.message); } return; }
    if (message.type === 'running') { running = true; canvas.focus(); }
    send(message);
    if (message.type === 'completed' || message.type === 'error') stop();
  };
  addEventListener('message', event => {
    const m=event.data;
    if(event.source===parent && m?.channel===channel && m.runId===runId && m.type==='run' && !terminal)worker.postMessage({type:'run',code:m.code});
  });
  let keys={}, pos=[0,0], buttons=[false,false,false];
  const keyCode = key => ({ArrowLeft:1073741904,ArrowRight:1073741903,ArrowUp:1073741906,ArrowDown:1073741905,Escape:27,Enter:13,' ':32}[key] ?? (key.length===1?key.toLowerCase().charCodeAt(0):0));
  const input = event => { if(running && !terminal)worker.postMessage({type:'input',keys,pos,buttons,event}); };
  addEventListener('keydown', e=>{if(!running)return;if(e.key==='Escape'){send({type:'close'});stop();return;}e.preventDefault();const key=keyCode(e.key);keys[key]=true;if(!e.repeat)input({type:768,key});});
  addEventListener('keyup', e=>{const key=keyCode(e.key);keys[key]=false;input({type:769,key});});
  const position = e=>{const r=canvas.getBoundingClientRect();pos=[Math.round((e.clientX-r.left)*canvas.width/r.width),Math.round((e.clientY-r.top)*canvas.height/r.height)];};
  canvas.addEventListener('pointerdown',e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);position(e);buttons[e.button]=true;input({type:1025,pos,button:e.button===1?2:e.button===2?3:1});});
  canvas.addEventListener('pointerup',e=>{position(e);buttons[e.button]=false;input({type:1026,pos,button:e.button===1?2:e.button===2?3:1});});
  canvas.addEventListener('pointermove',e=>{position(e);input({type:1024,pos});});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  addEventListener('blur',()=>{keys={};buttons=[false,false,false];input();});
  addEventListener('pagehide',stop);
})();
