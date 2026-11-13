import {products, money, imageForColor, imageSources, installImageFallback} from './catalog.js';
import {createCommerce} from './commerce.js';
import {createUI} from './ui.js';
import {Showroom} from './showroom.js';
import './showroom.css';

installImageFallback();
const commerce = createCommerce(products);
let engine;
let selected = products[0];
let activeCategory = 'Gaun Wanita';
const ui = createUI({
  products, money, imageForColor, commerce,
  onCategory(category) {
    activeCategory=category;
    engine?.setCategory(category);
  },
  onSelect(id) {engine?.select(id);},
  onStep(delta) {engine?.step(delta);},
  onInspect(id) {engine?.inspect(typeof id==='string'?id:selected.id);},
  onColor(color) {engine?.setColor(selected.id,color);},
  onOverview() {engine?.overview();},
  onGarmentView(view) {engine?.setGarmentView(view);}
});

function selection(product,meta={}) {
  selected=product;
  ui.updateProduct(product,{...meta,total:meta.total??meta.count??products.length,category:meta.category??activeCategory});
  ui.setMode(meta.mode==='focus'?'inspect':'overview');
}
selection(selected,{index:0,total:8,category:activeCategory,mode:'runway'});
try {
  engine = new Showroom({
    canvas:document.getElementById('showroomCanvas'), products, imageForColor, imageSources,
    onSelect:selection,
    onInspect:selection,
    onReady() {ui.setReady();},
    onError(error) {ui.setError(error.message || 'Showroom 3D belum dapat dibuka.');}
  });
} catch(error) {
  ui.setError(error.message || 'Perangkat ini belum mendukung WebGL.');
}

// Public coordination surface for accessible HUD actions, deep links and QA.
window.YASHBI_3D = {engine,commerce,ui,products};
const query = new URLSearchParams(location.search);
const linked = products.find(product=>product.id===String(query.get('product')||'').toUpperCase());
if(linked) {
  selected=linked;
  engine?.select(linked.id);
  ui.showLookbook(linked.id);
}
commerce.syncQueue().catch(()=>{});
window.addEventListener('online',()=>commerce.syncQueue().catch(()=>{}));
window.addEventListener('pagehide',event=>{if(!event.persisted)engine?.dispose();});
