export class Soundscape {
  constructor(){this.context=null;this.volume=.55;this.muted=false;this.running=false;this.nextNote=0;this.nextBird=0;this.travel=0;}
  async start(){
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
    }
    await this.context.resume();this.running=true;this.applyVolume();
  }
  applyVolume(){if(this.context)this.master.gain.setTargetAtTime(this.muted?0:this.volume*.65,this.context.currentTime,.35);}
  setVolume(v){this.volume=v;this.applyVolume();}
  toggle(){this.muted=!this.muted;this.applyVolume();return !this.muted;}
  chime(frequency=660,pan=0,level=.13){
    if(!this.context||!this.running)return;
    const c=this.context,now=c.currentTime;
    const p=c.createStereoPanner();p.pan.value=pan;p.connect(this.master);
    let finished=0;
    for(const [ratio,gain] of [[1,1],[2.76,.22],[4.1,.07]]){
      const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=frequency*ratio;
      g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(level*gain,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+4.5);
      o.connect(g).connect(p);o.start(now);o.stop(now+4.6);o.onended=()=>{o.disconnect();g.disconnect();if(++finished===3)p.disconnect();};
    }
  }
  bird(){
    if(!this.context)return;const c=this.context,t=c.currentTime,o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner();
    p.pan.value=Math.sin(t*.1)*.8;o.type='sine';o.frequency.setValueAtTime(1200,t);o.frequency.exponentialRampToValueAtTime(1800,t+.15);o.frequency.exponentialRampToValueAtTime(1050,t+.55);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.012,t+.1);g.gain.linearRampToValueAtTime(0,t+.65);
    o.connect(g).connect(p).connect(this.master);o.start();o.stop(t+.7);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect();};
  }
  update(time,speed){
    if(!this.context||!this.running||this.context.state!=='running')return;
    this.surfGain.gain.setTargetAtTime(.25+Math.sin(time*.25)*.07,this.context.currentTime,.5);
    if(time>this.nextNote){this.chime([330,440,495,660,742.5][Math.floor(Math.random()*5)],Math.sin(time*.12)*.7,.055);this.nextNote=time+13+Math.random()*17;}
    if(time>this.nextBird){this.bird();this.nextBird=time+24+Math.random()*28;}
    if(speed>.2&&time>this.travel){this.chime(70,0,.025);this.travel=time+1.4/speed;}
  }
  async suspend(){if(this.context)await this.context.suspend();}
}
