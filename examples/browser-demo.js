(async function () {
  const E = AnimatedShorts, canvas = document.getElementById("picture"), status = document.getElementById("status");
  canvas.getContext("2d", {willReadFrequently:true});
  const C = E.characters, cast = [
    C.makeCharacter({ name:"Courier",note:"Prototype for code demonstration; redesign for the actual story",seed:3,scale:1.03,
      parts:[C.BODY_PARTS.slender,C.FACE_PARTS.attentive,C.WARDROBE_PARTS.workwear],
      outfit:{jacket:"#df7745",pants:"#31485b",boots:"#493a31",skin:"#c99067",hair:"#2b2021"},
      dna:{head:"egg",hair:"ponytail",eyeGap:1.05,posture:"upright"},
      acting:C.actingFrom({neutral:{base:"listen"},grin:{base:"grin"},shock:{base:"shock"},deadpan:{base:"deadpan"}},{jaw:.9,w:1.05}) }),
    C.makeCharacter({ name:"Inspector",note:"Distinct prototype, not a required stock character",seed:5,scale:.84,
      parts:[C.BODY_PARTS.draped,C.FACE_PARTS.reserved,C.WARDROBE_PARTS.formal],
      outfit:{jacket:"#446c9b",pants:"#3a4654",boots:"#382c29",skin:"#ecd0b6",hair:"#62616a",hat:"peaked",cap:"#253a51",trim:"#bd9859"},
      dna:{head:"square",hair:"sidepart",age:1,posture:"proud"},
      acting:C.actingFrom({neutral:{base:"deadpan"},grin:{base:"smug"},shock:{base:"shock"},deadpan:{base:"deadpan"}},{jaw:.7,w:.85}) })
  ];
  const tracks=cast.map((c,i)=>({c,x:0,facing:i?-1:1,ph:i*1.3,face:[{f:-20,pose:"neutral"},{f:22,pose:i?"shock":"grin",take:true},{f:95,pose:"deadpan"}]}));
  let mode="2d",player,raf=0;
  function stop(){cancelAnimationFrame(raf);raf=0;player?.pause();}
  function render2d(t){
    const g=canvas.getContext("2d"),f=t*30;
    g.setTransform(1,0,0,1,0,0);g.fillStyle="#b8d0ec";g.fillRect(0,0,canvas.width,canvas.height);
    g.fillStyle="#d8c4aa";g.fillRect(0,canvas.height*.78,canvas.width,canvas.height*.22);
    for(let i=0;i<cast.length;i++){
      const x=canvas.width*(i?.7:.3),y=canvas.height*.84;
      g.fillStyle="rgba(36,23,38,.18)";g.beginPath();g.ellipse(x,y+4,canvas.width*.055,canvas.height*.007,0,0,Math.PI*2);g.fill();
      E.drawCharacter(g,cast[i],{x,groundY:y,pixelsPerUnit:canvas.height/1900,track:tracks[i],frame:f,view:i?"left":"right"});
    }
  }
  async function setup3d(){
    if(player)return;
    const T=E.THREE;
    const pose=({f,actor})=>cast.forEach((c,i)=>actor(c.name,{p:[i?.8:-.8,0,0],...E.acting.cardFields(E.acting.act(tracks[i],f,150,E.acting.MODES.wild))}));
    const take=(mood)=>({set:"courtyard",mood,
      camera:f=>({pos:[1.4+f*.003,2.2,8.4-f*.002],look:[0,1.15,0]}),
      sun:()=>({centre:new T.Vector3(0,1,0),radius:8}),pose});
    const film={total:150,fps:30,
      makeWorld:()=>E.worldRecipes.makeRecipeWorld({cast,sets:{courtyard(root){
        E.palette.part(root,new T.BoxGeometry(30,.16,30),E.palette.PAL.stone,0,-.08,0);
        const b=new E.worldBuild.Batch();
        E.houses.house(b,{x:0,z:-7,seed:23,w:9,d:5,floors:2,bays:4,wall:"#efe4d2",roof:"gable",roofCol:"#cc7c66"});b.build(root);
        const props=E.worldRecipes.assembleProps(root,[{source:"victorian/table",at:[0,0,-1.2]},{source:"victorian/teapot",at:[0,.78,-1.2],contact:0},{source:"victorian/teacup",at:[.35,.78,-1.2],contact:0}]);
        return {update:({f})=>props.update(f)};
      }},takes:{day:take("day"),evening:take("golden")}}),
      layersAt:E.transitions.makeTxLayersAt([{id:"day",a:0,b:90},{id:"evening",a:90,b:150}],[{kind:"timePass",f:90,n:24},{kind:"loop",f:150,n:9}],150),
      dofAt:()=>({cInf:5}),moodOf:id=>id==="day"?"day":"golden",
      tx:[{kind:"timePass",f:90,n:24},{kind:"loop",f:150,n:9}]};
    player=await E.createFilmPlayer(film,canvas,{width:540,height:960});
  }
  function render(t){ if(mode==="3d")player.renderAt(t);else render2d(t); }
  async function setMode(value){stop();if(value==="3d")await setup3d();mode=value;render(0);status.textContent="Ready: "+mode.toUpperCase()+" prototype. Use story-specific direction for a finished film.";}
  document.getElementById("play").onclick=()=>{stop();const start=performance.now();function tick(){render(((performance.now()-start)/1000)%5);raf=requestAnimationFrame(tick);}tick();};
  document.getElementById("pause").onclick=stop;
  document.getElementById("mode2d").onclick=()=>setMode("2d").catch(fail);
  document.getElementById("mode3d").onclick=()=>setMode("3d").catch(fail);
  document.getElementById("seek").oninput=e=>{stop();render(Number(e.target.value));};
  const sheet=document.getElementById("sheet");
  document.getElementById("silhouette").onclick=()=>{sheet.width=1080;sheet.height=1920;E.drawLineup(sheet,"Prototype",cast,2);sheet.hidden=false;};
  document.getElementById("turnaround").onclick=()=>{sheet.width=2400;sheet.height=1500;E.drawCharacterSheet(sheet,"Prototype",cast,0);sheet.hidden=false;};
  document.getElementById("faces").onclick=()=>{sheet.width=1080;sheet.height=1920;E.drawFaceSheet(sheet,cast,0);sheet.hidden=false;};
  function download(blob,name){const link=document.createElement("a"),url=URL.createObjectURL(blob);link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  document.getElementById("png").onclick=()=>canvas.toBlob(blob=>download(blob,"animation-frame.png"));
  document.getElementById("record").onclick=async()=>{
    stop();status.textContent="Recording five seconds; slow rendering can drop frames.";
    try{const result=await E.captureCanvas(canvas,render,{duration:5,fps:30,audio:document.getElementById("audio").files[0]});
      download(result.blob,"animation-preview.webm");status.textContent=result.timing+" Skipped steps: "+result.skipped_steps;render(0);
    }catch(error){fail(error);}
  };
  function fail(error){window.demoError=String(error);status.textContent=String(error);}
  window.demo={E,cast,tracks,render,setMode,get player(){return player;},stop};
  render(0);window.demoReady=true;status.textContent="Ready: Canvas prototype; no network or setup required.";
})().catch(error=>{window.demoError=String(error);document.getElementById("status").textContent=String(error);});
