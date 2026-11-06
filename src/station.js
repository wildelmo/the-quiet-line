import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A small, inhabited place, built at human scale. All stationary details are
// merged by material: the timber, tiles and leaves do not each cost a draw call.
export function createStation(scene) {
  let seed = 831;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const batches = new Map();
  const station = new THREE.Group();station.name = 'Summer Sea station';scene.add(station);
  function paintTexture() {
    const canvas = document.createElement('canvas');canvas.width = 512;canvas.height = 256;
    const ctx = canvas.getContext('2d');ctx.fillStyle = '#d9c6a4';ctx.fillRect(0, 0, 512, 256);
    // Long, uneven grain strokes and soft sun-bleached washes.
    for (let i = 0; i < 220; i++) {
      const y = random() * 256, x = random() * 512;
      ctx.strokeStyle = random() > .45 ? '#665b4724' : '#fff4cf42';ctx.lineWidth = .5 + random() * 2;
      ctx.beginPath();ctx.moveTo(x - 220, y);ctx.bezierCurveTo(x - 50, y + 5, x + 80, y - 5, x + 260, y + 2);ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const x = random() * 512, y = random() * 256;
      ctx.strokeStyle = '#65574438';ctx.lineWidth = 1.2;
      for (let j = 0; j < 3; j++) { ctx.beginPath();ctx.ellipse(x, y, 9 + j * 7, 2 + j * 2, 0, 0, Math.PI * 2);ctx.stroke(); }
    }
    const texture = new THREE.CanvasTexture(canvas);texture.colorSpace = THREE.SRGBColorSpace;return texture;
  }
  const grain = paintTexture();
  const material = (color, map = null) => new THREE.MeshStandardMaterial({color, map, vertexColors:true, roughness:1, emissive:color, emissiveIntensity:.09});
  const timber = material('#bc956c', grain), teal = material('#527f77', grain);
  const cream = material('#e2d7b5'), tile = material('#ae634b', grain);
  const dark = material('#574b3d'), brass = material('#af8d4c');
  const clay = material('#b66e51'), foliage = material('#5d8050'), flowers = material('#e6bc68');
  const leather = material('#9a6549', grain), cloth = material('#7b9993', grain);
  const stem = material('#536946');
  function add(geometry, mat, position, rotation = [0, 0, 0], tint = 1) {
    // Nonindexed geometry gives every batch the same attribute layout.
    const geo = geometry.index ? geometry.toNonIndexed() : geometry;
    if (geo !== geometry) geometry.dispose();
    geo.rotateX(rotation[0]);geo.rotateY(rotation[1]);geo.rotateZ(rotation[2]);geo.translate(...position);
    const count = geo.attributes.position.count, colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) colors.set([tint, tint, tint], i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (!batches.has(mat)) batches.set(mat, []);batches.get(mat).push(geo);
  }
  const box = (p, size, mat, rotation = [0,0,0], tint = 1, radius = .025) =>
    add(new RoundedBoxGeometry(...size, 1, Math.min(radius, ...size.map(v => v / 3))), mat, p, rotation, tint);
  const cylinder = (p, top, bottom, height, mat, rotation = [0,0,0]) =>
    add(new THREE.CylinderGeometry(top, bottom, height, 12), mat, p, rotation);
  const sphere = (p, scale, mat, rotation = [0,0,0], tint = 1) => {
    const geo = new THREE.SphereGeometry(1, 10, 6);geo.scale(...scale);add(geo, mat, p, rotation, tint);
  };
  const beam = (a, b, width, mat) => {
    const delta = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
    const geo = new RoundedBoxGeometry(width, delta.length(), width, 1, width * .15);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize()));
    add(geo, mat, a.map((v,i) => (v + b[i]) / 2));
  };

  // Staggered board ends, rounded edges and occasional old nail heads.
  for (let row = 0; row < 21; row++) {
    const split = -2.5 + (row % 3) * .63, z = 1.7 + row * .26;
    for (const [a,b] of [[-5.5,split],[split,1.5]]) {
      box([(a+b)/2,.21,z], [b-a-.016,.18,.245], timber, [0,0,0], .85 + random() * .3, .018);
      for (const x of [a+.075,b-.075]) cylinder([x,.302,z], .012,.012,.005, dark);
    }
  }
  for (const x of [-5.2,-2,1.2]) {
    box([x,-.04,4.3],[.2,.32,5.7],dark);
    for (const z of [2,4.5,7]) cylinder([x,-.68,z],.12,.15,1.8,teal);
  }
  box([-2,.13,1.54],[7.1,.25,.12],timber);
  box([-5.52,.12,4.3],[.12,.28,5.7],timber);
  box([-2,.13,7.06],[7.1,.25,.12],timber);

  // Open-sided gabled shelter. The roof ridge runs toward the arrival point.
  for (const x of [-5.1,-2.6]) for (const z of [4.2,6.6]) {
    box([x,1.57,z],[.16,2.55,.16],teal);
    box([x,.44,z],[.22,.26,.22],cream);
    box([x,2.65,z],[.23,.13,.23],cream);
    beam([x,2.15,z],[x,2.73,z+(z<5 ? .48 : -.48)],.10,cream);
    beam([x,2.20,z],[x+(x<-4 ? .43 : -.43),2.73,z],.10,cream);
    // Thin patches where the teal paint has worn back to timber.
    for (let j=0;j<4;j++) box([x+.083,.55+random()*1.9,z-.045+random()*.09],[.004,.025+random()*.07,.012+random()*.018],timber,[random()*.3,0,0],.8,.001);
  }
  for (const z of [4.2,6.6]) box([-3.85,2.76,z],[2.85,.18,.16],cream);
  for (const x of [-5.25,-2.45]) {
    box([x,2.78,5.4],[.16,.17,2.65],cream);
    beam([x,2.84,3.81],[x,3.49,5.4],.13,cream);
    beam([x,3.49,5.4],[x,2.84,6.99],.13,cream);
    beam([x,2.8,5.4],[x,3.45,5.4],.10,teal);
  }
  // Slightly lifted eaves and overlapping tile rows, with a warm dark underside.
  const roofHeight = d => 3.5 - .48 * d + .10 * d*d;
  for (const side of [-1,1]) {
    for (let row=0;row<5;row++) {
      const d=.18+row*.345, y=roofHeight(d), slope=(-.48+.20*d)*side;
      const angle=-Math.atan(slope);
      box([-3.85,y-.065,5.4+side*d],[3.55,.10,.40],timber,[angle,0,0],.86);
      for (let col=0;col<11;col++) {
        box([-5.49+col*.328,y,5.4+side*d],[.35,.085,.41],tile,[angle,0,0],.87+random()*.24,.035);
      }
    }
    box([-3.85,roofHeight(1.67)-.04,5.4+side*1.67],[3.68,.13,.13],cream);
  }
  for (let i=0;i<12;i++) cylinder([-5.53+i*.305,3.52,5.4],.095,.095,.32,tile,[0,0,Math.PI/2]);

  // Bench faces into the platform, with a little curve to its back and arms.
  for(let i=0;i<4;i++)box([-4.72+i*.14,.77,5.42],[.12,.09,1.85],timber);
  for(let i=0;i<3;i++)box([-4.83-i*.025,1.04+i*.16,5.42],[.09,.125,1.9],timber,[0,0,.12]);
  for(const z of [4.66,6.17]) {
    for(const x of [-4.72,-4.3])box([x,.53,z],[.09,.45,.11],teal);
    box([-4.8,.97,z],[.09,1.15,.09],teal,[0,0,.10]);
    box([-4.5,1.02,z],[.62,.08,.10],timber);
    box([-4.27,.88,z],[.07,.24,.07],teal);
  }

  // A leather suitcase and tied parcel suggest somebody will be back soon.
  box([-4.42,1.03,5.98],[.36,.44,.62],leather,[0,.07,0],1,.065);
  for(const z of [5.77,6.18])box([-4.42,1.035,z],[.375,.455,.035],dark,[0,.07,0],1,.014);
  beam([-4.43,1.25,5.86],[-4.43,1.33,5.86],.027,dark);
  beam([-4.43,1.33,5.86],[-4.43,1.33,6.10],.027,dark);
  beam([-4.43,1.33,6.10],[-4.43,1.25,6.10],.027,dark);
  box([-4.23,1.07,5.98],[.025,.07,.10],brass);
  box([-4.42,.91,4.95],[.40,.22,.41],cloth,[0,-.13,0],1,.08);
  sphere([-4.42,1.06,4.95],[.08,.055,.055],cloth);

  function sign(lines, p, width, height, rotationY=0) {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#f1e5bf';ctx.fillRect(0,0,1024,512);
    // Small pigment variations and enamel chips, kept away from the lettering.
    for(let i=0;i<800;i++){ctx.fillStyle=i%2?'#8b784310':'#fff8dd30';ctx.fillRect(random()*1024,random()*512,2+random()*20,1+random()*4);}
    ctx.strokeStyle='#537c70';ctx.lineWidth=10;ctx.strokeRect(24,24,976,464);
    ctx.fillStyle='#31594f';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='68px Georgia';ctx.fillText(lines[0],512,210,900);
    ctx.font='32px Georgia';ctx.fillText(lines[1],512,335,900);
    for(const x of [49,975])for(const y of [49,463]){ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();}
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    const group=new THREE.Group();group.position.set(...p);group.rotation.y=rotationY;station.add(group);
    // Separate outward faces keep the words readable from either direction.
    const signMat=new THREE.MeshStandardMaterial({map,roughness:1,emissive:'#f1e5bf',emissiveIntensity:.1});
    for(const side of [-1,1]){const face=new THREE.Mesh(new THREE.PlaneGeometry(width,height),signMat);face.position.z=side*.022;face.rotation.y=side<0?Math.PI:0;group.add(face);}
    const backing=new THREE.Mesh(new RoundedBoxGeometry(width+.07,height+.07,.038,1,.018),new THREE.MeshStandardMaterial({color:'#527f77',roughness:1}));group.add(backing);
  }
  // Suspended gable sign looks toward the visitor, not away across the ocean.
  for(const z of [4.94,5.86])beam([-2.42,2.79,z],[-2.42,2.55,z],.018,brass);
  sign(['THE QUIET LINE','No last train. No hurry.'],[-2.40,2.28,5.4],1.65,.55,Math.PI/2);
  cylinder([-4.8,1.29,1.9],.043,.055,1.95,teal);
  sphere([-4.8,2.31,1.9],[.07,.07,.07],brass);
  sign(['SUMMER SEA','Stay as long as you like'],[-4.72,2.02,1.9],1.35,.52,Math.PI/2);

  function plant(x,z,size=1,bloom=false) {
    const y=.31;
    cylinder([x,y+.16*size,z],.20*size,.14*size,.32*size,clay);
    cylinder([x,y+.31*size,z],.215*size,.215*size,.055*size,clay);
    cylinder([x,y+.342*size,z],.18*size,.18*size,.01,dark);
    for(let i=0;i<9;i++) {
      const a=i*2.4, reach=(.12+random()*.12)*size;
      const top=[x+Math.cos(a)*reach,y+(.54+random()*.3)*size,z+Math.sin(a)*reach];
      beam([x,y+.33*size,z],top,.012*size,stem);
      for(let j=0;j<3;j++) {
        const f=.35+j*.20;
        const leafSize=(.7+random()*.6)*size;
        sphere([x+(top[0]-x)*f+.09*Math.cos(a+j),y+.33*size+(top[1]-y-.33*size)*f,z+(top[2]-z)*f+.06*Math.sin(a+j)], [.13*leafSize,.018*leafSize,.047*leafSize],foliage,[.3+random()*.7,a+j,.2+random()*.8],.78+random()*.45);
      }
      if(bloom){
        for(let j=0;j<5;j++){const b=j*Math.PI*2/5;sphere([top[0]+Math.cos(b)*.047*size,top[1],top[2]+Math.sin(b)*.047*size],[.045*size,.018*size,.035*size],flowers,[0,b,0]);}
        sphere(top,[.025*size,.024*size,.025*size],brass);
      }
    }
  }
  plant(-2.65,4.03,.85,true);plant(-5.05,3.35,1.25);plant(-5.05,6.86,.72,true);
  // A watering can left by the pots.
  cylinder([-4.68,.49,3.42],.13,.15,.31,teal);
  beam([-4.55,.46,3.42],[-4.28,.63,3.42],.06,teal);
  sphere([-4.27,.65,3.42],[.075,.025,.07],cream,[0,0,.5]);
  add(new THREE.TorusGeometry(.14,.018,6,16,Math.PI*1.5),teal,[-4.8,.54,3.42],[Math.PI/2,0,Math.PI/4]);

  // Reusable soft contact wash, rather than real-time shadow maps in stereo.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const ctx=shadowCanvas.getContext('2d'), wash=ctx.createRadialGradient(64,64,5,64,64,64);
  wash.addColorStop(0,'rgba(37,52,43,.28)');wash.addColorStop(.5,'rgba(37,52,43,.16)');wash.addColorStop(1,'rgba(37,52,43,0)');
  ctx.fillStyle=wash;ctx.fillRect(0,0,128,128);
  const shadowMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
  for(const [x,z,w,h] of [[-3.9,5.4,3.5,3.1],[-4.5,5.4,1.2,2.5],[-2.65,4.03,.7,.7],[-5.05,3.35,.9,.9]]) {
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w,h),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.307,z);station.add(shadow);
  }
  // Paper lanterns under the eaves, lit as the day goes. They are warm paper by
  // day and the station's own small moons by night.
  const lanternMat=new THREE.MeshStandardMaterial({color:'#f6e4bd',emissive:'#ffb860',emissiveIntensity:0,roughness:1});
  const lanternBand=material('#a84f3c');
  const lanterns=[];
  for(const [x,z] of [[-2.9,4.35],[-2.9,6.45],[-4.9,6.5]]) {
    cylinder([x,2.52,z],.004,.004,.26,dark);
    const body=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),lanternMat);body.scale.set(1,1.25,1);body.position.set(x,2.22,z);station.add(body);lanterns.push(body);
    for(const y of [2.36,2.08])add(new THREE.TorusGeometry(.085,.012,5,14),lanternBand,[x,y,z],[Math.PI/2,0,0]);
  }
  const lanternLight=new THREE.PointLight('#ffb866',0,11,2);lanternLight.position.set(-3.4,2.1,5.4);station.add(lanternLight);

  // A pinwheel by the marker post turns whenever the wind remembers it.
  cylinder([-4.55,1.1,1.9],.012,.012,.9,timber);
  const pinwheel=new THREE.Group();pinwheel.position.set(-4.55,1.56,1.9);pinwheel.rotation.y=Math.PI/2;station.add(pinwheel);
  const vaneColours=['#e2574b','#f0c04a','#5fa89d','#f5ecd5'];
  for(let i=0;i<4;i++){
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.11,.02);shape.lineTo(.085,.1);shape.lineTo(0,0);
    const vane=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:vaneColours[i],side:THREE.DoubleSide,roughness:.9,emissive:vaneColours[i],emissiveIntensity:.08}));
    vane.rotation.z=i*Math.PI/2;vane.position.z=.012*(i%2?1:-1)*.4;pinwheel.add(vane);
  }
  const hub=new THREE.Mesh(new THREE.SphereGeometry(.016,8,6),brass);pinwheel.add(hub);

  // Cloth streamers from the gable, so the breeze has something to carry.
  const streamers=[];
  for(const [x,colour] of [[-3.3,'#f3d9a4'],[-3.0,'#9ec8c1'],[-2.72,'#f1b7b0']]) {
    const geometry=new THREE.PlaneGeometry(.07,.95,1,9);
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:colour,side:THREE.DoubleSide,roughness:1,emissive:colour,emissiveIntensity:.07}));
    mesh.position.set(x,2.75-.475,3.78);station.add(mesh);streamers.push({mesh,phase:x*3});
  }

  // A round ginger cat asleep on the bench. Nobody knows whose it is.
  const cat=new THREE.Group();cat.position.set(-4.62,1.03,5.12);cat.rotation.y=.35;station.add(cat);
  const fur=new THREE.MeshStandardMaterial({color:'#d99a58',roughness:1,emissive:'#d99a58',emissiveIntensity:.08});
  const paleFur=new THREE.MeshStandardMaterial({color:'#f4e4c6',roughness:1,emissive:'#f4e4c6',emissiveIntensity:.08});
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),fur);body.scale.set(.2,.12,.17);cat.add(body);
  const chest=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),paleFur);chest.scale.set(.1,.07,.1);chest.position.set(.08,-.01,.06);cat.add(chest);
  const head=new THREE.Group();head.position.set(.16,.07,.05);head.rotation.set(.15,.5,-.35);cat.add(head);
  const skull=new THREE.Mesh(new THREE.SphereGeometry(.085,14,10),fur);head.add(skull);
  const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),paleFur);muzzle.position.set(0,-.025,.065);muzzle.scale.set(1.2,.8,1);head.add(muzzle);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.009,6,5),new THREE.MeshStandardMaterial({color:'#c96c6c',roughness:1}));nose.position.set(0,-.012,.102);head.add(nose);
  const ears=[];
  for(const side of [-1,1]){
    const ear=new THREE.Mesh(new THREE.ConeGeometry(.028,.055,4),fur);ear.position.set(side*.05,.078,-.005);ear.rotation.z=-side*.35;head.add(ear);ears.push(ear);
    const inner=new THREE.Mesh(new THREE.ConeGeometry(.014,.034,4),new THREE.MeshStandardMaterial({color:'#e8a9a0',roughness:1}));inner.position.set(0,-.006,.008);ear.add(inner);
    const eye=new THREE.Mesh(new THREE.TorusGeometry(.012,.0025,4,8,Math.PI),new THREE.MeshStandardMaterial({color:'#3a2a20',roughness:1}));eye.position.set(side*.034,.012,.074);eye.rotation.set(0,0,Math.PI);head.add(eye);
    for(let w=0;w<2;w++){const whisker=new THREE.Mesh(new THREE.CylinderGeometry(.0008,.0008,.09,3),paleFur);whisker.position.set(side*.055,-.02-w*.012,.085);whisker.rotation.z=side*(1.25+w*.25);head.add(whisker);}
  }
  const stripes=new THREE.MeshStandardMaterial({color:'#b9773a',roughness:1,emissive:'#b9773a',emissiveIntensity:.06});
  for(let i=0;i<4;i++){const stripe=new THREE.Mesh(new THREE.TorusGeometry(.17-i*.015,.011,4,16,Math.PI*.8),stripes);stripe.position.set(-.09+i*.065,.03,0);stripe.rotation.set(Math.PI/2,0,Math.PI*1.1);stripe.scale.set(1,.75,.6);cat.add(stripe);}
  const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.15,-.02,.03),new THREE.Vector3(-.2,-.03,.13),new THREE.Vector3(-.08,-.03,.2),new THREE.Vector3(.06,-.02,.2)]);
  const tail=new THREE.Mesh(new THREE.TubeGeometry(tailCurve,16,.022,7,false),fur);cat.add(tail);
  const tailTip=new THREE.Mesh(new THREE.SphereGeometry(.024,8,6),paleFur);tailTip.position.set(.06,-.02,.2);cat.add(tailTip);

  for(const [mat,geometries] of batches) {
    const merged=mergeGeometries(geometries,false);
    if(!merged)throw new Error('Station geometry could not be merged.');
    station.add(new THREE.Mesh(merged,mat));geometries.forEach(geo=>geo.dispose());
  }
  const streamerPositions=streamers.map(s=>s.mesh.geometry.attributes.position);
  station.userData.animate=(time,dt,light,breeze,still=false)=>{
    const t=still?0:time;
    const glow=light.lantern;
    lanternMat.emissiveIntensity=glow*2.2;lanternLight.intensity=glow*7;
    pinwheel.rotation.z+=still?0:dt*(1.5+breeze.gust*9);
    streamers.forEach(({mesh,phase},i)=>{
      const position=streamerPositions[i];
      for(let v=0;v<position.count;v++){
        const y=position.getY(v), hang=(0.475-y)/.95;
        position.setZ(v,Math.sin(t*2.4+phase+hang*4)*.035*hang*(.5+breeze.gust)+hang*hang*.16*(.4+breeze.gust));
        position.setX(v,(v%2?-.035:.035)+Math.sin(t*1.7+phase+hang*3)*.02*hang);
      }
      position.needsUpdate=true;mesh.geometry.computeVertexNormals();
    });
    // Slow breathing, an ear that twitches, and a tail tip that remembers a dream.
    body.scale.y=.12+Math.sin(t*1.1)*.004;chest.scale.y=.07+Math.sin(t*1.1)*.003;
    const twitch=Math.max(0,Math.sin(t*.37))>.995?1:0;ears[1].rotation.z=-.35-twitch*.3;
    tailTip.position.y=-.02+Math.max(0,Math.sin(t*.23))**12*.05;
  };
  station.userData.cat=cat;station.userData.lanterns=lanterns;station.userData.pinwheel=pinwheel;
  return station;
}
