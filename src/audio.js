// Everything is synthesized on-device: water, wind, a music box that remembers a
// few notes at a time, crickets after dark, and the far voices of visitors.

// A pentatonic music-box phrase, picked note by note so each one is a small
// surprise that still belongs. Pure, so tests can inspect it.
export const SCALE = [392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
export function composePhrase(random = Math.random, length = 5 + Math.floor(random() * 4)) {
  const notes = [];let index = 2 + Math.floor(random() * 3), at = 0;
  for (let i = 0; i < length; i++) {
    const step = random() < .55 ? (random() < .5 ? -1 : 1) : (random() < .5 ? -2 : 2);
    index = Math.max(0, Math.min(SCALE.length - 1, index + step));
    notes.push({ frequency: SCALE[index], at, hold: random() < .25 });
    at += .42 + (random() < .3 ? .42 : 0);
  }
  return notes;
}

export class Soundscape {
  constructor(){this.context=null;this.volume=.55;this.muted=false;this.running=false;this.closed=false;this.nextNote=0;this.nextBird=0;this.nextPhrase=22;this.nextCricket=0;this.travel=0;}
  async start(){
    if(this.closed)return;
    if(!this.context){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      this.context=new Audio(); const c=this.context;
      this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
      const buffer=c.createBuffer(2,c.sampleRate*6,c.sampleRate);
      for(let ch=0;ch<2;ch++){const a=buffer.getChannelData(ch);let last=0;for(let i=0;i<a.length;i++){last=(last+(Math.random()*2-1)*.02)/1.02;a[i]=last*3.5;}}
      this.surf=c.createBufferSource();this.surf.buffer=buffer;this.surf.loop=true;
      const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=650;
      this.surfGain=c.createGain();this.surfGain.gain.value=.35;this.surf.connect(low).connect(this.surfGain).connect(this.master);this.surf.start();
      this.wind=c.createBufferSource();this.wind.buffer=buffer;this.wind.loop=true;this.wind.playbackRate.value=.72;
      const windFilter=c.createBiquadFilter();windFilter.type='bandpass';windFilter.frequency.value=1100;windFilter.Q.value=.4;
      const windGain=c.createGain();windGain.gain.value=.13;this.wind.connect(windFilter).connect(windGain).connect(this.master);this.wind.start();
      // A feedback delay gives the music box and bells somewhere wide to ring.
      this.space=c.createGain();this.space.gain.value=1;
      const delay=c.createDelay(1.5);delay.delayTime.value=.37;const feedback=c.createGain();feedback.gain.value=.42;
      const dull=c.createBiquadFilter();dull.type='lowpass';dull.frequency.value=2400;const wet=c.createGain();wet.gain.value=.3;
      this.space.connect(this.master);this.space.connect(delay);delay.connect(dull).connect(feedback).connect(delay);dull.connect(wet).connect(this.master);
      // A warm evening pad, silent by day.
      this.pad=c.createGain();this.pad.gain.value=0;this.pad.connect(this.space);
      for(const [f,detune] of [[98,0],[147,4],[196,-3]]){const o=c.createOscillator();o.type='triangle';o.frequency.value=f;o.detune.value=detune;const g=c.createGain();g.gain.value=.012;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;o.connect(lp).connect(g).connect(this.pad);o.start();}
    }
    await this.context.resume();if(this.closed)return;this.running=true;this.applyVolume();
  }
  applyVolume(){if(this.context&&!this.closed)this.master.gain.setTargetAtTime(this.muted?0:this.volume*.65,this.context.currentTime,.35);}
  setVolume(v){this.volume=v;this.applyVolume();}
  toggle(){this.muted=!this.muted;this.applyVolume();return !this.muted;}
  chime(frequency=660,pan=0,level=.13){
    if(!this.context||!this.running)return;
    const c=this.context,now=c.currentTime;
    const p=c.createStereoPanner();p.pan.value=pan;p.connect(this.space);
    let finished=0;
    for(const [ratio,gain] of [[1,1],[2.76,.22],[4.1,.07]]){
      const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=frequency*ratio;
      g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(level*gain,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+4.5);
      o.connect(g).connect(p);o.start(now);o.stop(now+4.6);o.onended=()=>{o.disconnect();g.disconnect();if(++finished===3)p.disconnect();};
    }
  }
  // Music box: a bright plucked partial over a soft fundamental, each note short.
  musicBox(frequency,at,level=.05,pan=0){
    if(!this.context||!this.running)return;
    const c=this.context,now=c.currentTime+at;
    const p=c.createStereoPanner();p.pan.value=pan;p.connect(this.space);
    let finished=0;const parts=[[1,1,'sine',2.2],[4,.28,'sine',.6],[6.3,.08,'triangle',.3]];
    for(const [ratio,gain,type,decay] of parts){
      const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=frequency*ratio;
      g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(level*gain,now+.006);g.gain.exponentialRampToValueAtTime(.0001,now+decay);
      o.connect(g).connect(p);o.start(now);o.stop(now+decay+.05);o.onended=()=>{o.disconnect();g.disconnect();if(++finished===parts.length)p.disconnect();};
    }
  }
  phrase(random=Math.random){
    const notes=composePhrase(random);const pan=(random()*2-1)*.5;
    for(const note of notes)this.musicBox(note.frequency,note.at,note.hold?.06:.045,pan);
    return notes;
  }
  bird(){
    if(!this.context)return;const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner();
    p.pan.value=Math.sin(t*.1)*.8;o.type='sine';o.frequency.setValueAtTime(1200,t);o.frequency.exponentialRampToValueAtTime(1800,t+.15);o.frequency.exponentialRampToValueAtTime(1050,t+.55);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.012,t+.1);g.gain.linearRampToValueAtTime(0,t+.65);
    o.connect(g).connect(p).connect(this.master);o.start();o.stop(t+.7);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect();};
  }
  // A cricket: a fast trill of tiny high pulses, somewhere off to one side.
  cricket(level){
    if(!this.context||!this.running)return;const c=this.context,t=c.currentTime;
    const o=c.createOscillator(),g=c.createGain(),trill=c.createOscillator(),trillGain=c.createGain(),p=c.createStereoPanner();
    o.type='sine';o.frequency.value=4100+Math.random()*500;trill.type='square';trill.frequency.value=28+Math.random()*8;
    trillGain.gain.value=1;trill.connect(trillGain);trillGain.connect(g.gain);
    g.gain.value=0;const amp=c.createGain();amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(level,t+.15);amp.gain.setValueAtTime(level,t+1.1+Math.random());amp.gain.linearRampToValueAtTime(0,t+2.4);
    p.pan.value=Math.random()*1.6-.8;o.connect(g).connect(amp).connect(p).connect(this.master);o.start(t);trill.start(t);o.stop(t+2.5);trill.stop(t+2.5);
    o.onended=()=>{o.disconnect();g.disconnect();amp.disconnect();p.disconnect();trillGain.disconnect();};
  }
  // Two soft notes a fifth apart, low-passed, from far across the water.
  trainWhistle(){
    if(!this.context||!this.running)return;const c=this.context,t=c.currentTime;
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;const p=c.createStereoPanner();p.pan.value=-.5;lp.connect(p).connect(this.space);
    let finished=0;const voices=[[311,.03],[466,.022],[622,.008]];
    for(const [f,level] of voices){const o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.value=f;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level,t+.6);g.gain.setValueAtTime(level,t+1.6);g.gain.linearRampToValueAtTime(0,t+2.6);
      g.gain.linearRampToValueAtTime(level*.8,t+3.3);g.gain.setValueAtTime(level*.8,t+4.6);g.gain.linearRampToValueAtTime(0,t+5.8);
      o.connect(g).connect(lp);o.start(t);o.stop(t+6);o.onended=()=>{o.disconnect();g.disconnect();if(++finished===voices.length){lp.disconnect();p.disconnect();}};}
  }
  // A faint propeller hum that drifts from one side to the other and away.
  planeHum(){
    if(!this.context||!this.running)return;const c=this.context,t=c.currentTime,seconds=120;
    const o=c.createOscillator(),g=c.createGain(),lp=c.createBiquadFilter(),p=c.createStereoPanner(),wobble=c.createOscillator(),wobbleGain=c.createGain();
    o.type='sawtooth';o.frequency.value=74;lp.type='lowpass';lp.frequency.value=260;wobble.type='sine';wobble.frequency.value=.7;wobbleGain.gain.value=3;wobble.connect(wobbleGain).connect(o.frequency);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.016,t+seconds*.45);g.gain.linearRampToValueAtTime(0,t+seconds);
    p.pan.setValueAtTime(.9,t);p.pan.linearRampToValueAtTime(-.9,t+seconds);
    o.connect(lp).connect(g).connect(p).connect(this.master);o.start(t);wobble.start(t);o.stop(t+seconds);wobble.stop(t+seconds);
    o.onended=()=>{o.disconnect();lp.disconnect();g.disconnect();p.disconnect();wobbleGain.disconnect();};
  }
  update(time,speed,light={night:0,lantern:0}){
    if(!this.context||!this.running||this.context.state!=='running')return;
    const now=this.context.currentTime;
    this.surfGain.gain.setTargetAtTime(.25+Math.sin(time*.25)*.07,now,.5);
    this.pad.gain.setTargetAtTime(light.lantern*.9,now,2);
    if(time>this.nextNote){this.chime([330,440,495,660,742.5][Math.floor(Math.random()*5)],Math.sin(time*.12)*.7,.045);this.nextNote=time+16+Math.random()*18;}
    if(time>this.nextPhrase){this.phrase();this.nextPhrase=time+38+Math.random()*34;}
    if(time>this.nextBird&&light.night<.5){this.bird();this.nextBird=time+24+Math.random()*28;}
    if(time>this.nextCricket&&light.lantern>.4){this.cricket(.006*light.lantern);this.nextCricket=time+2+Math.random()*4;}
    if(speed>.2&&time>this.travel){this.chime(70,0,.025);this.travel=time+1.4/speed;}
  }
  async suspend(){if(this.context&&!this.closed)await this.context.suspend();}
  async dispose(){
    if(this.closed)return;this.closed=true;this.running=false;
    if(!this.context)return;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setValueAtTime(0,this.context.currentTime);
    this.master.disconnect();
    if(this.context.state!=='closed')await this.context.close();
  }
}
