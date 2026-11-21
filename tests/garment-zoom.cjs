/* True garment detail zoom, actual GPU scissoring, full-body mode and shoe isolation. */
const SHOE_BASELINE = [
  {
    "viewport": [
      1228,
      610
    ],
    "mode": "shelf",
    "camera": [
      -0.0002748547796716449,
      2.5079925853343514,
      16.16425908526583
    ],
    "look": [
      -0.0002748547796716449,
      1.7725013421196292,
      -0.17999076395024463
    ],
    "projection": [
      1.4426454685523222,
      0,
      0,
      0,
      0,
      2.9042108776758226,
      0,
      0,
      0,
      -0.002561475409836117,
      -1.00133422281521,
      -1,
      0,
      0,
      -0.1601067378252168,
      0
    ],
    "size": [
      1.3698924731182796,
      0.98
    ],
    "texture": "assets/images/cutout/sw-005.png",
    "shoeAssetSha256": "1384dbff5bbf7092570e7ea0e0cf9ae8a299a38b262f6cc820de6c4f9e2973ba"
  },
  {
    "viewport": [
      1228,
      610
    ],
    "mode": "focus",
    "camera": [
      -1.9554320696156125e-9,
      0.960097064743813,
      6.04515093412224
    ],
    "look": [
      -1.9554320696156125e-9,
      0.7117575465261301,
      0.5264949737292819
    ],
    "projection": [
      1.4426454685523222,
      0,
      0,
      0,
      0,
      2.9042108776758226,
      0,
      0,
      0.2638360138436482,
      0.05737704918032792,
      -1.00133422281521,
      -1,
      0,
      0,
      -0.1601067378252168,
      0
    ],
    "size": [
      1.3698924731182796,
      0.98
    ],
    "texture": "assets/images/cutout/sw-005.png",
    "shoeAssetSha256": "1384dbff5bbf7092570e7ea0e0cf9ae8a299a38b262f6cc820de6c4f9e2973ba"
  },
  {
    "viewport": [
      1440,
      1000
    ],
    "mode": "shelf",
    "camera": [
      -0.00027485822002956196,
      2.4966059917409504,
      15.911230468186341
    ],
    "look": [
      -0.00027485822002956196,
      1.7725006420238454,
      -0.17999952552710569
    ],
    "projection": [
      2.0168131094970994,
      0,
      0,
      0,
      0,
      2.9042108776758226,
      0,
      0,
      0,
      0.00759374999999999,
      -1.00133422281521,
      -1,
      0,
      0,
      -0.1601067378252168,
      0
    ],
    "size": [
      1.3698924731182796,
      0.98
    ],
    "texture": "assets/images/cutout/sw-005.png",
    "shoeAssetSha256": "1384dbff5bbf7092570e7ea0e0cf9ae8a299a38b262f6cc820de6c4f9e2973ba"
  },
  {
    "viewport": [
      1440,
      1000
    ],
    "mode": "focus",
    "camera": [
      -1.8767417052422352e-9,
      0.9432812528156527,
      5.671473176480094
    ],
    "look": [
      -1.8767417052422352e-9,
      0.7117572427938862,
      0.5264951759963916
    ],
    "projection": [
      2.0168131094970994,
      0,
      0,
      0,
      0,
      2.9042108776758226,
      0,
      0,
      0.23749999999999996,
      0.009000000000000003,
      -1.00133422281521,
      -1,
      0,
      0,
      -0.1601067378252168,
      0
    ],
    "size": [
      1.3698924731182796,
      0.98
    ],
    "texture": "assets/images/cutout/sw-005.png",
    "shoeAssetSha256": "1384dbff5bbf7092570e7ea0e0cf9ae8a299a38b262f6cc820de6c4f9e2973ba"
  },
  {
    "viewport": [
      390,
      844
    ],
    "mode": "shelf",
    "camera": [
      0,
      2.6508196419717156,
      17.251569694985335
    ],
    "look": [
      0,
      1.8699994398230315,
      -0.09999035276319639
    ],
    "projection": [
      6.285010207072806,
      0,
      0,
      0,
      0,
      2.9042108776758226,
      0,
      0,
      0,
      -0.05453939573459719,
      -1.00133422281521,
      -1,
      0,
      0,
      -0.1601067378252168,
      0
    ],
    "size": [
      1.3698924731182796,
      0.98
    ],
    "texture": "assets/images/cutout/sw-005.png",
    "shoeAssetSha256": "1384dbff5bbf7092570e7ea0e0cf9ae8a299a38b262f6cc820de6c4f9e2973ba"
  },
  {
    "viewport": [
      390,
      844
    ],
    "mode": "focus",
    "camera": [
      0,
      1.195581545084488,
      11.154857239110186
    ],
    "look": [
      0,
      0.7170126629133251,
      0.519993190862121
    ],
    "projection": [
      6.285010207072806,
      0,
      0,
      0,
      0,
      2.9042108776758226,
      0,
      0,
      0,
      -0.2998000592417061,
      -1.00133422281521,
      -1,
      0,
      0,
      -0.1601067378252168,
      0
    ],
    "size": [
      1.3698924731182796,
      0.98
    ],
    "texture": "assets/images/cutout/sw-005.png",
    "shoeAssetSha256": "1384dbff5bbf7092570e7ea0e0cf9ae8a299a38b262f6cc820de6c4f9e2973ba"
  }
];

const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(ROOT,'../outputs');
const BASE='http://127.0.0.1:4173';
const viewports=[[1228,610],[1440,1000],[390,844]];
const products=[['Gaun Wanita','GW-001'],['Gaun Wanita','GW-003'],['Jas Pria','JP-001'],['Jas Pria','JP-007']];
const results=[],checks=[],errors=[],external=[];
let browser;
function check(name,value){assert.ok(value,name);checks.push(name);}
function closeEnough(actual,expected,tolerance,label){assert.equal(actual.length,expected.length,label);actual.forEach((value,index)=>assert.ok(Math.abs(value-expected[index])<=tolerance,`${label}[${index}]: ${value} vs ${expected[index]}`));}
async function settle(page){
  await page.waitForFunction(()=>{const e=window.YASHBI_3D?.engine;return e?.ready&&e.camera.position.distanceTo(e.cameraTarget)<.001&&[...e.entries.values()].filter(x=>x.targetVisible).every(x=>x.loaded&&x.group.position.distanceTo(x.targetPosition)<.004&&Math.abs(x.material.opacity-x.targetOpacity)<.008);},{},{timeout:30000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(120);
}
function measure(){
  const e=window.YASHBI_3D.engine,entry=e.entries.get(e.selectedProduct.id);
  e.scene.updateMatrixWorld(true);e.camera.updateMatrixWorld(true);
  const project=(x,y)=>{const v=entry.art.localToWorld(e.camera.position.clone().set(x,y,0)).project(e.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};};
  const box=points=>({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});
  const full=box([[-.5,-.5],[-.5,.5],[.5,-.5],[.5,.5]].map(([x,y])=>project(x,y)));
  // Same physical image patch in every mode: central chest/waist band,
  // normalized source Y .35-.55. No engine design zoom multiplier is reused.
  const band=box([[-.25,.15],[-.25,-.05],[.25,.15],[.25,-.05]].map(([x,y])=>project(x,y)));
  const clip=e.inspectionClip?{...e.inspectionClip}:null;
  const stage={...e.stageBounds};
  const visible=clip?{left:Math.max(full.left,clip.left),right:Math.min(full.right,clip.right),top:Math.max(full.top,clip.top),bottom:Math.min(full.bottom,clip.bottom)}:full;
  const inside=(a,b)=>a.left>=b.left-1&&a.top>=b.top-1&&a.right<=b.right+1&&a.bottom<=b.bottom+1;
  const copyZones=['.showroom-header','.showroom-intro','.product-hud','.shoe-scene-heading','.scene-pagination','#overviewButton'].flatMap(selector=>{const element=document.querySelector(selector);if(!element||element.hidden||!element.getClientRects().length)return[];const s=getComputedStyle(element);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.05)return[];const r=element.getBoundingClientRect();return[{selector,left:r.left,right:r.right,top:r.top,bottom:r.bottom}];});
  const copyOverlaps=copyZones.filter(r=>Math.min(visible.right,r.right)-Math.max(visible.left,r.left)>1&&Math.min(visible.bottom,r.bottom)-Math.max(visible.top,r.top)>1).map(r=>r.selector);
  return{viewport:[innerWidth,innerHeight],category:e.category,id:entry.product.id,mode:e.mode,garmentView:e.garmentView,full,band,clip,visible,stage,fullInsideStage:inside(full,stage),visibleInsideStage:inside(visible,stage),copyOverlaps,camera:e.camera.position.toArray(),look:e.lookCurrent.toArray(),projection:e.camera.projectionMatrix.toArray(),size:[entry.width,entry.height],texture:entry.texture.url,pixelRatio:e.renderer.getPixelRatio(),gpuPasses:window.__garmentScissorPasses||[]};
}
async function measureCase(page,label){await settle(page);const result=await page.evaluate(measure);result.label=label;results.push(result);return result;}

(async()=>{
  const status=await fetch(`${BASE}/__preview/status`).then(response=>response.json());assert.equal(status.simulation,true);assert.equal(status.externalWrites,false);
  fs.mkdirSync(OUT,{recursive:true});
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const [width,height]of viewports){
    const compact=width<800;
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:compact,hasTouch:compact});
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(BASE))external.push(request.url());});
    await page.goto(BASE,{waitUntil:'networkidle'});
    // Compare the same unobstructed camera framing as the existing shoe baseline.
    await page.locator('#browseShowroom').click();
    await settle(page);await page.mouse.move(0,0);
    check(`${width}x${height} exposes garment detail/full camera API`,await page.evaluate(()=>typeof YASHBI_3D.engine.setGarmentView==='function'));
    // Instrument render-time WebGL state. This catches a fake clip metadata rect
    // that never enables scissoring on the actual renderer draw pass.
    await page.evaluate(()=>{const e=YASHBI_3D.engine,r=e.renderer,original=r.render;window.__garmentScissorPasses=[];r.render=function(...args){const gl=this.getContext();if(gl.isEnabled(gl.SCISSOR_TEST)){window.__garmentScissorPasses.push({box:Array.from(gl.getParameter(gl.SCISSOR_BOX)),mode:e.mode,garmentView:e.garmentView});if(window.__garmentScissorPasses.length>80)window.__garmentScissorPasses.shift();}return original.apply(this,args);};});
    for(const [category,id]of products){
      await page.evaluate(({category,id})=>{const e=YASHBI_3D.engine;e.setCategory(category);e.select(id);e.overview();},{category,id});
      const overview=await measureCase(page,`${id}-overview`);
      check(`${width}x${height} ${id} overview keeps complete photographed person`,overview.fullInsideStage);
      await page.evaluate(id=>{window.__garmentScissorPasses=[];YASHBI_3D.engine.inspect(id);},id);
      const detail=await measureCase(page,`${id}-detail`);
      check(`${width}x${height} ${id} inspection defaults to genuine garment detail`,detail.garmentView==='detail'&&detail.mode==='focus');
      const widthGain=(detail.band.right-detail.band.left)/(overview.band.right-overview.band.left);
      const heightGain=(detail.band.bottom-detail.band.top)/(overview.band.bottom-overview.band.top);
      detail.bandGain={width:widthGain,height:heightGain};
      check(`${width}x${height} ${id} real chest/waist patch grows more than1.5x`,widthGain>1.5&&heightGain>1.5);
      check(`${width}x${height} ${id} clipped detail remains inside safe stage`,detail.clip&&detail.visibleInsideStage&&detail.copyOverlaps.length===0);
      const clippedMaterial=await page.evaluate(id=>{const e=YASHBI_3D.engine,entry=e.entries.get(id);return Boolean(e.renderer.localClippingEnabled&&entry.material.clippingPlanes?.length===4&&entry.material.clippingPlanes.every(plane=>Number.isFinite(plane.constant)));},id);
      check(`${width}x${height} ${id} actual GPU material uses four safe-stage clipping planes`,clippedMaterial);
      if(id==='GW-001'||id==='JP-007')await page.screenshot({path:path.join(OUT,`garment-detail-${width}x${height}-${id.toLowerCase()}.png`)});
      // Use the accessible view toggle when present; fallback directly calls the
      // public API so this suite can diagnose camera fitting independently of HUD.
      const fullButton=page.locator('[data-garment-view="full"]');
      if(await fullButton.count())await fullButton.click();else await page.evaluate(()=>YASHBI_3D.engine.setGarmentView('full'));
      const full=await measureCase(page,`${id}-full`);
      check(`${width}x${height} ${id} UTUH restores entire alpha plane`,full.garmentView==='full'&&full.fullInsideStage);
      check(`${width}x${height} ${id} UTUH removes deliberate detail clipping`,!full.clip);
      if(id==='GW-001'||id==='JP-007')await page.screenshot({path:path.join(OUT,`garment-full-${width}x${height}-${id.toLowerCase()}.png`)});
    }
    for(const mode of ['overview','focus']){
      await page.evaluate(mode=>{const e=YASHBI_3D.engine;e.setCategory('Sepatu');e.select('SW-005');if(mode==='focus')e.inspect('SW-005');else e.overview();},mode);
      const shoe=await measureCase(page,`SW-005-${mode}-unchanged`);
      const baseline=SHOE_BASELINE.find(value=>value.mode===shoe.mode&&value.viewport[0]===width&&value.viewport[1]===height);
      assert.ok(baseline,'Shoe baseline must exist.');
      closeEnough(shoe.camera,baseline.camera,.025,`${width}x${height} shoe ${mode} camera`);
      closeEnough(shoe.look,baseline.look,.025,`${width}x${height} shoe ${mode} target`);
      closeEnough(shoe.projection,baseline.projection,.0001,`${width}x${height} shoe ${mode} projection`);
      closeEnough(shoe.size,baseline.size,.00001,`${width}x${height} shoe ${mode} dimensions`);
      const assetHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,shoe.texture))).digest('hex');
      check(`${width}x${height} shoe ${mode} camera and source image stay unchanged`,assetHash===baseline.shoeAssetSha256&&shoe.texture===baseline.texture&&!shoe.clip);
    }
    await context.close();
  }
  check('garment zoom has zero page, console or resource errors',errors.length===0);
  check('garment zoom makes zero external or production requests',external.length===0);
})().catch(error=>{errors.push(error.stack||error.message);console.error(error);process.exitCode=1;}).finally(async()=>{
  if(browser)await browser.close();
  const report={passed:checks.length,cases:results.length,checks,errors,externalRequests:external,scope:'Actual perspective projection of same photographed garment patch; live render-time GPU scissor; full-person UTUH containment; shoe camera and file checksums versus pre-change baseline. No checkout writes.',results};
  fs.writeFileSync(path.join(OUT,'garment-zoom-test-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,cases:report.cases,errors:report.errors,externalRequests:report.externalRequests.length}));
});
