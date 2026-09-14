const rgb = hex => hex.slice(1).match(/../g).map(v=>parseInt(v,16));
const color = values => '#'+values.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const mix = (a,b,amount) => a.map((v,i)=>v*(1-amount)+b[i]*amount);
export function contrast(a,b) {
  const lum = hex => rgb(hex).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function appearanceTokens(accent='#f5f5f7',theme='light') {
  const hex=/^#[\da-f]{6}$/i.test(accent)?accent:'#f5f5f7';
  const light=theme==='light',raw=rgb(hex),colored=Math.max(...raw)-Math.min(...raw)>12;
  const base=light?{bg:'#f5f5f7',sidebar:'#f0f0f3',panel:'#ffffff','panel-hover':'#ebebef',line:'#dddde2'}:{bg:'#171719',sidebar:'#1d1d20',panel:'#232326','panel-hover':'#2d2d31',line:'#3c3c42'};
  const tokens=Object.fromEntries(Object.entries(base).map(([key,value])=>[key,colored?color(mix(rgb(value),raw,key==='line'?.16:key==='panel'?.035:.07)):value]));
  let readable=raw;
  for(let i=0;i<50 && Object.values(tokens).some(bg=>contrast(color(readable),bg)<4.5);i++)readable=mix(readable,[light?0:255,light?0:255,light?0:255],.08);
  tokens.accent=hex;tokens.blue=color(readable);
  tokens['accent-ink']=contrast(hex,'#ffffff')>=4.5?'#ffffff':contrast(hex,'#090b10')>=4.5?'#090b10':'#000000';
  tokens.control=colored?hex:light?'#252527':'#efeff2';
  tokens['control-ink']=colored?tokens['accent-ink']:light?'#ffffff':'#202023';
  tokens['blue-tint']=color(mix(rgb(tokens.panel),raw,.12));
  tokens['home-violet']=tokens.blue;tokens['home-action']=tokens.control;
  return tokens;
}
