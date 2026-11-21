/* Geometry-versus-visible-copy regression. Reads the real WebGL world matrices.
 * Local preview only; this suite never calls checkout or writes to a live service.
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const BASE=process.env.PREVIEW_URL||'http://127.0.0.1:4173';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(BASE))throw new Error('Local preview required.');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(ROOT,'../outputs');
fs.mkdirSync(OUT,{recursive:true});
const VIEWPORTS=[[1440,1000],[1366,768],[1228,610],[1024,768],[1920,1080],[390,844],[360,800],[844,390]];
const requested=process.env.LAYOUT_VIEWPORTS?.split(',');
const viewports=VIEWPORTS.filter(([w,h])=>!requested||requested.includes(`${w}x${h}`));
const cases=[],runtimeErrors=[];
const tag=process.env.LAYOUT_TAG||'current';
let browser;

async function settle(page){
  await page.waitForFunction(()=>{
    const e=window.YASHBI_3D?.engine;
    return e?.ready&&e.camera.position.distanceTo(e.cameraTarget)<.002&&[...e.entries.values()].filter(x=>x.targetVisible).every(x=>x.loaded&&x.group.position.distanceTo(x.targetPosition)<.006&&Math.abs(x.material.opacity-x.targetOpacity)<.006);
  },{},{timeout:30000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(100);
}

function inspectLayout(){
  const engine=window.YASHBI_3D.engine;
  engine.scene.updateMatrixWorld(true);engine.camera.updateMatrixWorld(true);
  const issues=[],zones=[],geometry=[];
  const boxOf=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
  const viewport={left:0,top:0,right:innerWidth,bottom:innerHeight};
  const rectIntersection=(a,b)=>({left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom)});
  function visible(element){
    if(!element||element.hidden||!element.getClientRects().length)return false;
    for(let node=element;node&&node.nodeType===1;node=node.parentElement){const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return false;}
    const r=element.getBoundingClientRect();return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight;
  }
  function clipToVisible(element,r){
    let clipped=rectIntersection(r,viewport);
    for(let node=element.parentElement;node;node=node.parentElement){const s=getComputedStyle(node);if(/hidden|clip|auto|scroll/.test(`${s.overflowX} ${s.overflowY}`))clipped=rectIntersection(clipped,node.getBoundingClientRect());}
    return clipped;
  }
  const selectors=['.showroom-header','.showroom-intro','.shoe-scene-heading','.product-hud','.showroom-footer','.scene-pagination','.chat-launch','#overviewButton','.stylist-greeting'];
  for(const selector of selectors){
    const element=document.querySelector(selector);
    if(!visible(element))continue;
    const rect=clipToVisible(element,element.getBoundingClientRect());
    if(rect.right-rect.left>1&&rect.bottom-rect.top>1)zones.push({selector,...rect});
  }
  const area=points=>Math.abs(points.reduce((sum,p,i)=>{const next=points[(i+1)%points.length];return sum+p.x*next.y-next.x*p.y;},0))/2;
  function hull(points){
    const sorted=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y);
    const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
    const lower=[],upper=[];
    for(const p of sorted){while(lower.length>1&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);}
    for(const p of sorted.reverse()){while(upper.length>1&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}
    lower.pop();upper.pop();return lower.concat(upper);
  }
  function clipPolygon(points,rect){
    let polygon=points;
    const edges=[['x',rect.left,1],['x',rect.right,-1],['y',rect.top,1],['y',rect.bottom,-1]];
    for(const [axis,boundary,sign] of edges){
      const next=[];
      for(let i=0;i<polygon.length;i++){
        const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=(a[axis]-boundary)*sign>=0,insideB=(b[axis]-boundary)*sign>=0;
        if(insideA)next.push(a);
        if(insideA!==insideB){const t=(boundary-a[axis])/(b[axis]-a[axis]);next.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
      }
      polygon=next;if(!polygon.length)break;
    }
    return polygon;
  }
  function project(mesh,points){
    return points.map(p=>{const v=mesh.localToWorld(engine.camera.position.clone().set(...p)).project(engine.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,z:v.z};});
  }
  const shelf=engine.mode==='shelf';
  const entries=[...engine.entries.values()].filter(entry=>entry.targetVisible&&entry.loaded&&(shelf||entry.product.id===engine.selectedProduct.id));
  for(const entry of entries){
    const parts=[{part:'alpha-plane',mesh:entry.art,corners:[[-.5,-.5,0],[-.5,.5,0],[.5,-.5,0],[.5,.5,0]]}];
    if(entry.shoe&&entry.pedestal.visible){
      entry.pedestal.children.forEach((mesh,index)=>{
        if(!mesh.isMesh||mesh.material.opacity<.9)return;
        mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox,corners=[];
        for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])corners.push([x,y,z]);
        parts.push({part:`pedestal-${index}`,mesh,corners});
      });
    }
    for(const part of parts){
      const rawPolygon=hull(project(part.mesh,part.corners));
      const polygon=part.part==='alpha-plane'&&engine.inspectionClip?clipPolygon(rawPolygon,engine.inspectionClip):rawPolygon;
      const total=area(polygon);
      const visibleArea=area(clipPolygon(polygon,viewport));
      const item={id:entry.product.id,part:part.part,polygon,rawPolygon,area:total,visibleArea};geometry.push(item);
      if(total-visibleArea>Math.max(4,total*.001))issues.push({kind:'geometry-outside-viewport',id:item.id,part:item.part,area:total-visibleArea});
      for(const zone of zones){
        // Half a pixel avoids reporting antialiased edges which merely touch.
        const inside={left:zone.left+.5,top:zone.top+.5,right:zone.right-.5,bottom:zone.bottom-.5};
        const overlap=area(clipPolygon(polygon,inside));
        if(overlap>Math.max(3,total*.00005))issues.push({kind:'geometry-covers-copy',id:item.id,part:item.part,zone:zone.selector,area:overlap});
      }
    }
  }
  const groups=['.product-hud','.showroom-header','.shoe-scene-heading','.scene-pagination','.showroom-intro','.stylist-greeting'];
  const textFragments=[];
  for(const selector of groups){
    const root=document.querySelector(selector);if(!visible(root))continue;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node,index=0;
    while(node=walker.nextNode()){
      if(!node.textContent.trim()||!visible(node.parentElement))continue;
      const range=document.createRange();range.selectNodeContents(node);
      const owner=node.parentElement.closest('button,a,h1,h2,h3,p,strong,small,span')||node.parentElement;
      for(const source of range.getClientRects()){
        const r=clipToVisible(node.parentElement,source);
        if(r.right-r.left<1||r.bottom-r.top<1)continue;
        const fragment={group:selector,index:index++,owner,text:node.textContent.trim().slice(0,90),rect:r};
        textFragments.push(fragment);
      }
    }
  }
  for(let i=0;i<textFragments.length;i++)for(let j=i+1;j<textFragments.length;j++){
    const a=textFragments[i],b=textFragments[j];
    if(a.owner===b.owner)continue;
    const intersection=rectIntersection(a.rect,b.rect),width=intersection.right-intersection.left,height=intersection.bottom-intersection.top;
    if(width>1.5&&height>1.5&&width*height>5)issues.push({kind:'text-overlap',a:{text:a.text,group:a.group,rect:a.rect},b:{text:b.text,group:b.group,rect:b.rect},area:width*height});
  }
  const controls=[...document.querySelectorAll(groups.map(selector=>`${selector} button,${selector} a`).join(','))].filter(visible).map(element=>({element,rect:clipToVisible(element,element.getBoundingClientRect()),label:element.id||element.getAttribute('aria-label')||element.textContent.trim().slice(0,50)}));
  for(const fragment of textFragments)for(const control of controls){
    if(control.element.contains(fragment.owner)||fragment.owner.contains(control.element))continue;
    const intersection=rectIntersection(fragment.rect,control.rect),width=intersection.right-intersection.left,height=intersection.bottom-intersection.top;
    if(width>1.5&&height>1.5&&width*height>5)issues.push({kind:'text-control-overlap',text:fragment.text,control:control.label,textRect:fragment.rect,controlRect:control.rect,area:width*height});
  }
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
    const a=controls[i],b=controls[j];if(a.element.contains(b.element)||b.element.contains(a.element))continue;
    const intersection=rectIntersection(a.rect,b.rect),width=intersection.right-intersection.left,height=intersection.bottom-intersection.top;
    if(width>1.5&&height>1.5&&width*height>5)issues.push({kind:'control-overlap',a:a.label,b:b.label,area:width*height});
  }
  for(const selector of ['#hudTitle','.hud-price','.hud-options','.hud-actions','#hudDetails']){
    const element=document.querySelector(selector);if(!visible(element))continue;
    const r=element.getBoundingClientRect(),hud=document.querySelector('.product-hud').getBoundingClientRect();
    if(r.left<hud.left-1||r.right>hud.right+1)issues.push({kind:'hud-horizontal-overflow',selector,rect:boxOf(r),hud:boxOf(hud)});
  }
  return{viewport:{width:innerWidth,height:innerHeight},category:engine.category,mode:engine.mode,selectedId:engine.selectedProduct.id,page:engine.page,geometryCount:geometry.length,foregroundIds:entries.map(x=>x.product.id),zones,geometry,textFragmentCount:textFragments.length,stage:engine.stageBounds,issues};
}

async function measure(page,label){
  await settle(page);
  const result=await page.evaluate(inspectLayout);result.label=label;
  cases.push(result);
  if(result.issues.length||process.env.LAYOUT_SCREENSHOTS==='all'){
    const name=`text-layout-${tag}-${result.viewport.width}x${result.viewport.height}-${label.replace(/[^a-z0-9-]/gi,'-')}.png`;
    result.screenshot=name;
    await page.screenshot({path:path.join(OUT,name)});
  }
  console.log(`${result.issues.length?'FAIL':'PASS'} ${result.viewport.width}x${result.viewport.height} ${label} (${result.geometryCount} real geometry parts / ${result.textFragmentCount} copy fragments): ${result.issues.length} collisions`);
}

(async()=>{
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const [width,height]of viewports){
    const compact=width<=800||height<=550;
    const context=await browser.newContext({viewport:{width,height},hasTouch:compact,isMobile:compact,deviceScaleFactor:1});
    const page=await context.newPage();
    page.on('pageerror',error=>runtimeErrors.push({viewport:`${width}x${height}`,message:error.message}));
    page.on('console',message=>{if(message.type()==='error')runtimeErrors.push({viewport:`${width}x${height}`,message:message.text()});});
    await page.goto(BASE,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.YASHBI_3D?.engine?.ready);
    await page.locator('#stylistGreeting').waitFor({state:'visible'});
    for(const [category,longId]of [['Gaun Wanita','GW-003'],['Jas Pria','JP-007'],['Sepatu','SW-005']]){
      await page.evaluate(category=>YASHBI_3D.engine.setCategory(category),category);
      await measure(page,`${category}-overview`);
      await page.evaluate(id=>YASHBI_3D.engine.inspect(id),longId);
      await measure(page,`${category}-inspect-long-title`);
      await page.evaluate(()=>YASHBI_3D.engine.overview());
      if(category==='Sepatu'){
        await page.evaluate(()=>YASHBI_3D.engine.select('SP-007'));
        await measure(page,'Sepatu-last-page');
      }
    }
    await context.close();
  }
})().catch(error=>{runtimeErrors.push({message:error.stack||error.message});console.error(error);}).finally(async()=>{
  if(browser)await browser.close();
  const failed=cases.filter(item=>item.issues.length),collisionCount=failed.reduce((sum,item)=>sum+item.issues.length,0);
  const result={tag,passed:cases.length-failed.length,failed:failed.length,cases:cases.length,collisionCount,runtimeErrors,scope:'Actual projected product alpha planes and solid pedestal geometry versus visible text/control zones, plus DOM Range text collision checks. No commerce writes.',results:cases};
  const report=path.join(OUT,`text-layout-${tag}-results.json`);fs.writeFileSync(report,JSON.stringify(result,null,2));
  console.log(JSON.stringify({report,passed:result.passed,failed:result.failed,cases:result.cases,collisionCount,runtimeErrors},null,2));
  if(failed.length||runtimeErrors.length||!cases.length)process.exitCode=1;
});
