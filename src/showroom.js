import * as THREE from 'three';

const CANVAS_COLOR = '#F5F3EF';
const noop = () => {};
const clamp = THREE.MathUtils.clamp;
const isShoe = product => /Sepatu/i.test(product.category);
const asId = value => typeof value === 'object' ? value?.id : value;

/** A real WebGL installation. Commerce and the accessible HTML controls live outside it. */
export class Showroom {
  constructor({canvas, products = [], imageForColor, imageSources, onSelect = noop, onInspect = noop, onReady = noop, onError = noop, onContextRecovered = noop}) {
    if (!canvas) throw new Error('Showroom requires a canvas.');
    this.canvas = canvas;
    this.products = products;
    this.imageForColor = imageForColor || ((product, color) => product.colorImages?.[color] || product.image);
    this.imageSources = imageSources;
    this.callbacks = {onSelect, onInspect, onReady, onError, onContextRecovered};
    this.disposed = false;
    this.category = 'Gaun Wanita';
    this.mode = 'runway';
    this.garmentView = 'detail';
    this.garmentCenter = .4;
    this.inspectionClip = null;
    this.inspectionPlanes = Array.from({length:4},()=>new THREE.Plane());
    this.inspectionCorners = Array.from({length:4},()=>new THREE.Vector3());
    this.inspectionCenter = new THREE.Vector3();
    this.selectedIndex = 0;
    this.page = 0;
    this.entries = new Map();
    this.visibleProducts = products.filter(product => product.category === this.category);
    this.textureCache = new Map();
    this.materials = new Set();
    this.geometries = new Set();
    this.proceduralTextures = new Set();
    this.listeners = [];
    this.pointer = new THREE.Vector2(10, 10);
    this.raycaster = new THREE.Raycaster();
    this.hovered = null;
    this.drag = null;
    this.lastWheel = 0;
    this.frame = 0;
    this.lastTime = 0;
    this.renderedFrames = 0;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraTarget = new THREE.Vector3();
    this.cameraGoal = new THREE.Vector3();
    this.lookCurrent = new THREE.Vector3(0, 1.65, 0);
    this.lookTarget = this.lookCurrent.clone();
    this.cameraSway = new THREE.Vector2();
    this.focusLightTarget = new THREE.Vector3(0, 1.5, 0);
    this._isPointerInside = false;
    this.ready = false;

    try {
      this._createRenderer();
      this._createStudio();
      this._createProducts();
      this._bindInput();
      this.resize();
      this._layout(true);
      this._emitSelection();
      this._tick(0);
      const firstLoads = this.visibleProducts.slice(0, 5).map(product => this._loadEntry(this.entries.get(product.id), product.colors?.[0]));
      Promise.allSettled(firstLoads).then(() => {
        if (this.disposed) return;
        this.ready = true;
        this.callbacks.onReady(this);
        // Nearby objects load first; the remainder never blocks the first useful frame.
        this._preloadRemaining();
      });
    } catch (error) {
      this.callbacks.onError(error);
      this.dispose();
      throw error;
    }
  }

  _material(Material, options) {
    const material = new Material(options);
    this.materials.add(material);
    return material;
  }

  _geometry(geometry) {
    this.geometries.add(geometry);
    return geometry;
  }

  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({canvas:this.canvas, antialias:true, alpha:true, powerPreference:'high-performance', preserveDrawingBuffer:false});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.setClearColor(CANVAS_COLOR, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.localClippingEnabled = true;
    this.scene = new THREE.Scene();
    this.scene.name = 'Yashbi / physical studio';
    this.scene.background = new THREE.Color(CANVAS_COLOR);
    this.scene.fog = new THREE.FogExp2(CANVAS_COLOR, .035);
    this.camera = new THREE.PerspectiveCamera(38, 1, .08, 120);
    this.camera.position.set(0, 2.45, 8.7);
    this.cameraTarget.copy(this.camera.position);
    this.camera.lookAt(this.lookCurrent);
    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.setCrossOrigin('anonymous');
    this._listen(this.canvas, 'webglcontextlost', event => {
      event.preventDefault();
      this.contextLost = true;
      this.contextRecoveryPending = false;
      this.callbacks.onError(new Error('WebGL was interrupted. The showroom will resume when graphics recover.'), 'webgl');
    });
    this._listen(this.canvas, 'webglcontextrestored', () => {
      this.contextLost = false;
      this.contextRecoveryPending = true;
      this.activeUntil = performance.now() + 1600;
      this.materials.forEach(material => material.needsUpdate = true);
      this.textureCache.forEach(promise => promise.then(asset => {if (asset?.texture) asset.texture.needsUpdate = true;}));
    });
  }

  _createStudio() {
    const studio = new THREE.Group(); studio.name = 'Architecture / gallery'; this.scene.add(studio);
    const floorMaterial = this._material(THREE.MeshStandardMaterial, {color:'#E6E1D8', roughness:.82, metalness:.04});
    const floor = new THREE.Mesh(this._geometry(new THREE.PlaneGeometry(160, 160)), floorMaterial);
    floor.name = 'Studio floor / receives physical shadows'; floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; studio.add(floor);
    const wallMaterial = this._material(THREE.MeshStandardMaterial, {color:CANVAS_COLOR, roughness:1, metalness:0});
    const wall = new THREE.Mesh(this._geometry(new THREE.PlaneGeometry(100, 30)), wallMaterial);
    wall.name = 'Continuous studio backdrop'; wall.position.set(0, 14.98, -14); wall.receiveShadow = true; studio.add(wall);

    // Quiet architectural reveals provide perspective without painted CSS scenery.
    const revealMaterial = this._material(THREE.MeshStandardMaterial, {color:'#DDD6CB', roughness:.7, metalness:.08});
    [-7.2, 7.2].forEach(x => {
      const reveal = new THREE.Mesh(this._geometry(new THREE.BoxGeometry(.022, .012, 20)), revealMaterial);
      reveal.name = 'Inset stone floor seam'; reveal.position.set(x, .004, -4); studio.add(reveal);
    });
    const platform = new THREE.Mesh(this._geometry(new THREE.CylinderGeometry(4.9, 4.94, .025, 96)), this._material(THREE.MeshStandardMaterial,{color:'#ECE7DE', roughness:.88, metalness:.02}));
    platform.name = 'Circular runway / stone inlay'; platform.position.set(0, -.006, -.8); platform.receiveShadow = true; studio.add(platform);

    this.ambient = new THREE.AmbientLight('#FFF9ED', 1.7); this.ambient.name = 'Gallery ambient'; this.scene.add(this.ambient);
    const hemisphere = new THREE.HemisphereLight('#FAF9F6', '#C6BDAF', 1.25); hemisphere.name = 'Studio bounce'; this.scene.add(hemisphere);
    this.keyLight = new THREE.DirectionalLight('#FFF8EA', 2.5);
    this.keyLight.name = 'Large softbox / real alpha shadows'; this.keyLight.position.set(-3.5, 8, 5.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    Object.assign(this.keyLight.shadow.camera,{left:-12,right:12,top:11,bottom:-8,near:.1,far:32});
    this.keyLight.shadow.bias = -.00025; this.keyLight.shadow.normalBias = .018; this.keyLight.shadow.radius = 4;
    this.scene.add(this.keyLight);
    const rim = new THREE.DirectionalLight('#E8EDF0', 1.4); rim.name = 'Cool gallery fill'; rim.position.set(5, 5, -4); this.scene.add(rim);
    [-5.2, 5.2].forEach((x,index) => {
      const light = new THREE.SpotLight('#FFF3DC', 30, 20, .5, .8, 1.6);
      light.name = `Gallery spotlight ${index+1}`; light.position.set(x, 7.5, 2.5); light.target.position.set(x * .6, 0, -1);
      this.scene.add(light, light.target);
    });
    this.focusLight = new THREE.SpotLight('#FFF3DD', 8, 14, .52, .85, 1.7);
    this.focusLight.name = 'Selection spotlight'; this.focusLight.position.set(0, 6.2, 4);
    this.focusLight.target.position.copy(this.focusLightTarget); this.scene.add(this.focusLight, this.focusLight.target);
    this.productRoot = new THREE.Group(); this.productRoot.name = 'Products / raycastable 3D installation'; this.scene.add(this.productRoot);
    this.contactTexture = this._contactTexture();
  }

  _contactTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64,64,3,64,64,62);
    gradient.addColorStop(0,'rgba(35,29,20,.5)'); gradient.addColorStop(.3,'rgba(35,29,20,.27)'); gradient.addColorStop(1,'rgba(35,29,20,0)');
    context.fillStyle = gradient; context.fillRect(0,0,128,128);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    this.contactCanvas = canvas;
    return texture;
  }

  _createProducts() {
    const planeGeometry = this._geometry(new THREE.PlaneGeometry(1, 1));
    const contactGeometry = this._geometry(new THREE.PlaneGeometry(1, 1));
    const barGeometry = this._geometry(new THREE.BoxGeometry(1, 1, 1));
    const brushedNormal = this._brushedMetalTexture();
    const metalMaterial = this._material(THREE.MeshStandardMaterial,{color:'#28292B',metalness:.62,roughness:.38,normalMap:brushedNormal,normalScale:new THREE.Vector2(.14,.065)});
    const stoneMaterial = this._material(THREE.MeshStandardMaterial,{color:'#484743',metalness:.13,roughness:.62,normalMap:brushedNormal,normalScale:new THREE.Vector2(.07,.035)});
    const lineGeometry = this._geometry(new THREE.BoxGeometry(1,1,1));
    for (const product of this.products) {
      const group = new THREE.Group(); group.name = `Product ${product.id} / ${product.name}`; this.productRoot.add(group);
      const material = this._material(THREE.MeshStandardMaterial,{color:0xffffff,roughness:.92,metalness:0,side:THREE.DoubleSide,transparent:true,alphaTest:.055,depthWrite:true,toneMapped:false});
      // Direct diffuse illumination is calibrated down on the alpha artwork itself;
      // the physical studio keeps full PBR light and tone mapping.
      material.color.setRGB(.4,.4,.4);
      const art = new THREE.Mesh(planeGeometry,material); art.name = `Alpha cutout ${product.id}`; art.castShadow = true; art.receiveShadow = false;
      art.visible = false; art.renderOrder = 2; art.userData.productId = product.id; group.add(art);
      const depth = this._material(THREE.MeshDepthMaterial,{depthPacking:THREE.RGBADepthPacking,alphaTest:.055,side:THREE.DoubleSide});
      art.customDepthMaterial = depth;
      const shadowMaterial = this._material(THREE.MeshBasicMaterial,{map:this.contactTexture,transparent:true,depthWrite:false,opacity:.55,color:0xffffff,toneMapped:false});
      const contact = new THREE.Mesh(contactGeometry,shadowMaterial); contact.name = `Contact ellipse ${product.id}`; contact.rotation.x = -Math.PI / 2; contact.position.y = .013; contact.renderOrder = 1; group.add(contact);
      const pedestal = new THREE.Group(); pedestal.name = `Solid floating pedestal ${product.id}`; group.add(pedestal);
      const entryStoneMaterial=stoneMaterial.clone(),entryMetalMaterial=metalMaterial.clone();
      entryStoneMaterial.transparent=true;entryMetalMaterial.transparent=true;
      this.materials.add(entryStoneMaterial);this.materials.add(entryMetalMaterial);
      const stone = new THREE.Mesh(barGeometry,entryStoneMaterial); stone.scale.set(2.05,.095,.9); stone.position.y = .048; stone.receiveShadow = true; stone.castShadow = true; pedestal.add(stone);
      const lip = new THREE.Mesh(barGeometry,entryMetalMaterial); lip.scale.set(2.07,.027,.92); lip.position.y = .015; lip.receiveShadow = true; pedestal.add(lip);
      const glowMaterial = this._material(THREE.MeshStandardMaterial,{color:'#BAA482',emissive:'#BAA482',emissiveIntensity:.24,roughness:.5,metalness:.28,toneMapped:true,transparent:true});
      const glow = new THREE.Mesh(lineGeometry,glowMaterial); glow.name = `Emissive pedestal edge ${product.id}`; glow.scale.set(1.98,.012,.015); glow.position.set(0,.035,.465); pedestal.add(glow);
      const entry = {
        product, group, art, material, depth, contact, shadowMaterial, pedestal, glow, glowMaterial,pedestalMaterials:[entryStoneMaterial,entryMetalMaterial,glowMaterial],
        currentColor:product.colors?.[0] || '', requestedColor:product.colors?.[0] || '', texture:null, imageRatio:.65, height:3.35, loaded:false,loading:null,loadSerial:0,
        targetPosition:new THREE.Vector3(0,0,-18), positionVelocity:new THREE.Vector3(),
        targetRotation:0,targetScale:1,visibility:0,targetVisible:false,opacity:1,targetOpacity:1,hover:0,hoverTarget:0,
        baseY:0,shoe:isShoe(product),visibleIndex:-1
      };
      group.position.copy(entry.targetPosition); group.visible = false;
      this.entries.set(product.id,entry);
    }
  }

  _brushedMetalTexture() {
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
    const context=canvas.getContext('2d');const image=context.createImageData(canvas.width,canvas.height);
    let seed=731;
    for(let y=0;y<canvas.height;y++) {
      seed=(seed*16807)%2147483647;const grain=(seed%29)-14;
      for(let x=0;x<canvas.width;x++) {
        const offset=(y*canvas.width+x)*4;
        const fine=Math.sin(x*.15+y*.017)*2;
        image.data[offset]=128+fine;image.data[offset+1]=128+grain;image.data[offset+2]=255;image.data[offset+3]=255;
      }
    }
    context.putImageData(image,0,0);
    const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(4,1);texture.needsUpdate=true;
    this.proceduralTextures.add(texture);return texture;
  }

  _candidateSources(product, color) {
    const result = [];
    const add = value => {
      if (typeof value === 'string' && value && !result.includes(value)) result.push(value);
      else if (Array.isArray(value)) value.forEach(add);
    };
    add(this.imageForColor(product,color));
    if (this.imageSources) {
      try {add(this.imageSources(product,color));} catch (_) { /* Optional provenance does not block a valid cutout. */ }
    }
    add(product.originalColorImages?.[color]);
    add(product.originalSources?.[color]);
    add(product.originalSources?.image);
    add(product.originalImage);
    add(product.sourceImage);
    const current = result[0];
    if (current?.includes('/cutout/')) {
      const stem = current.split('/').pop().replace(/\.png(?:\?.*)?$/,'');
      const secondary = product.colors?.indexOf(color) > 0;
      add(`assets/images/raw/${stem}.${secondary ? 'png' : 'webp'}`);
      add(`assets/images/products/${stem}.${secondary ? 'png' : 'webp'}`);
    }
    add(product.image);
    return result;
  }

  _loadTexture(url) {
    if (this.textureCache.has(url)) return this.textureCache.get(url);
    const promise = new Promise((resolve,reject) => {
      this.textureLoader.load(url,texture => {
        if (this.disposed) {texture.dispose();resolve(null);return;}
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(this.mobile?4:8,this.renderer.capabilities.getMaxAnisotropy());
        texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true; texture.needsUpdate = true;
        const image = texture.image;
        let alpha = null;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(160,image.width); canvas.height = Math.max(1,Math.round(image.height * canvas.width / image.width));
          const context = canvas.getContext('2d',{willReadFrequently:true}); context.drawImage(image,0,0,canvas.width,canvas.height);
          alpha = {data:context.getImageData(0,0,canvas.width,canvas.height).data,width:canvas.width,height:canvas.height};
        } catch (_) { /* Tainted original-source fallback remains raycastable by its mesh. */ }
        resolve({texture,width:image.width,height:image.height,alpha,url});
      },undefined,() => reject(new Error(`Product image unavailable: ${url}`)));
    });
    // A rejected fallback is remembered, so navigation cannot repeatedly hammer it.
    promise.catch(noop); this.textureCache.set(url,promise); return promise;
  }

  async _loadEntry(entry,color) {
    if (!entry || this.disposed) return null;
    entry.requestedColor=color;
    if (entry.loaded && entry.currentColor === color) return entry;
    if (entry.loading && entry.loadingColor === color) return entry.loading;
    const serial = ++entry.loadSerial;
    entry.loadingColor = color;
    const operation = (async() => {
      const candidates = this._candidateSources(entry.product,color);
      let failure;
      for (const url of candidates) {
        try {
          const asset = await this._loadTexture(url);
          if (!asset || this.disposed || serial !== entry.loadSerial) return null;
          entry.texture = asset; entry.currentColor = color; entry.imageRatio = asset.width / asset.height;
          entry.material.map = asset.texture; entry.material.needsUpdate = true;
          entry.depth.map = asset.texture; entry.depth.needsUpdate = true;
          entry.loaded = true; entry.art.visible = true;
          this._sizeArtwork(entry);
          return entry;
        } catch(error) {failure = error;}
      }
      if (!entry.loaded && failure) this.callbacks.onError(failure);
      return null;
    })();
    entry.loading = operation;
    operation.finally(() => {if (serial === entry.loadSerial) entry.loading = null;});
    return operation;
  }

  async _preloadRemaining() {
    const category = this.category;
    const pending = this.visibleProducts.filter(product => !this.entries.get(product.id).loaded);
    // Only the open collection is decoded. Other collections load on navigation.
    let index = 0;
    await Promise.all(Array.from({length:this.mobile ? 2 : 4},async() => {
      while (!this.disposed && this.category === category && index < pending.length) {
        const product = pending[index++];
        const entry=this.entries.get(product.id);
        await this._loadEntry(entry,entry.requestedColor||entry.currentColor||product.colors?.[0]);
      }
    }));
  }

  _sizeArtwork(entry) {
    let height = entry.shoe ? .98 : 3.35;
    let width = height * entry.imageRatio;
    if (entry.shoe && width > 1.87) {width = 1.87;height = width / entry.imageRatio;}
    if (!entry.shoe && width > 2.38) {width = 2.38;height = width / entry.imageRatio;}
    entry.height = height; entry.width = width;
    entry.art.scale.set(width,height,1);
    const base = entry.shoe ? .115 : .018;
    entry.artBaseY=base+height/2;
    entry.art.position.y = entry.artBaseY;
    entry.contact.position.y = entry.shoe ? .109 : .014;
    entry.contact.scale.set(entry.shoe ? width * .98 : width * .92,entry.shoe ? .72 : .64,1);
    if (entry.targetVisible) this._queueLayout();
  }

  _listen(target,type,handler,options) {
    target.addEventListener(type,handler,options);
    this.listeners.push(() => target.removeEventListener(type,handler,options));
  }

  _blocked() {
    return Boolean(document.querySelector('dialog[open],.modal-panel.open:not(.nonblocking),.cart-drawer.open,[data-store-dialog-open="true"]'));
  }

  _bindInput() {
    // The showroom is a fixed full-screen stage. Keep native page panning from
    // swallowing the next HUD tap after a horizontal camera swipe.
    this.canvas.style.touchAction = 'none';
    this.canvas.setAttribute('tabindex','0');
    this.canvas.setAttribute('aria-label','Yashbi 3D showroom. Use the left and right arrow keys to select products.');
    this._listen(this.canvas,'pointerdown',event => {
      if (this._blocked() || !event.isPrimary || event.button > 0) return;
      this.drag = {id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,dx:0,dy:0,garmentCenter:this.garmentCenter,start:performance.now()};
      this.canvas.setPointerCapture?.(event.pointerId);
      this._pointerFromEvent(event); this.canvas.style.cursor = 'grabbing';
    });
    this._listen(this.canvas,'pointermove',event => {
      this._pointerFromEvent(event); this._isPointerInside = true;
      if (this.drag?.id === event.pointerId) {
        this.drag.dx = event.clientX - this.drag.x; this.drag.dy = event.clientY - this.drag.y;
        const relative = (event.clientX - this.drag.lastX) / Math.max(1,this.width);
        this.drag.lastX = event.clientX;
        if (this.inspectionClip && Math.abs(this.drag.dy)>Math.abs(this.drag.dx)*1.1) {
          const span=this.mobile?.27:.44;
          this.garmentCenter=clamp(this.drag.garmentCenter-this.drag.dy/Math.max(80,this.stageBounds.bottom-this.stageBounds.top)*span,.16,.84);
          this._layout();
        } else this.cameraSway.x = clamp(this.cameraSway.x - relative * 1.1,-.35,.35);
      } else if (!this._blocked()) this._updateHover();
    });
    const release = event => {
      if (!this.drag || event.pointerId !== this.drag.id) return;
      const drag = this.drag; this.drag = null;
      if (this.canvas.hasPointerCapture?.(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
      this.canvas.style.cursor = this.hovered ? 'pointer' : 'grab';
      if (this._blocked()) return;
      if (Math.abs(drag.dx) > 35 && Math.abs(drag.dx) > Math.abs(drag.dy) * 1.15) this.step(drag.dx < 0 ? 1 : -1);
      else if (Math.hypot(drag.dx,drag.dy) < 12) {
        this._pointerFromEvent(event);
        const hit = this._pick();
        if (hit) {
          if (hit.shoe || this.selectedProduct?.id === hit.product.id) this.inspect(hit.product.id);
          else this.select(hit.product.id);
        }
      }
    };
    this._listen(this.canvas,'pointerup',release);
    this._listen(this.canvas,'pointercancel',() => {this.drag = null;this.canvas.style.cursor='grab';});
    this._listen(this.canvas,'pointerleave',() => {
      this._isPointerInside = false;
      if (!this.drag) {this.pointer.set(10,10);this._setHover(null);}
    });
    this._listen(this.canvas,'wheel',event => {
      if (this._blocked()) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 3) return;
      event.preventDefault();
      if (performance.now() - this.lastWheel > 260) {this.lastWheel=performance.now();this.step(delta>0?1:-1);}
    },{passive:false});
    this._listen(window,'keydown',event => {
      if (event.defaultPrevented || this._blocked() || event.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      if (event.key === 'Escape' && this.mode === 'focus') {event.preventDefault();this.overview();return;}
      if (event.target.closest?.('button,a')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault();this.step(event.key === 'ArrowRight'?1:-1);}
      if (event.key === 'Enter' && document.activeElement === this.canvas && this.selectedProduct) {event.preventDefault();this.inspect(this.selectedProduct.id);}
    });
    this._listen(window,'resize',() => this.resize());
    this._listen(window,'yashbi:layout',() => this._queueLayout());
    document.fonts?.ready.then(() => this._queueLayout());
    this._listen(window,'blur',() => {this.drag=null;this._setHover(null);});
    this._listen(document,'visibilitychange',() => {this.lastTime=0;});
    this.resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.resize()) : null;
    this.resizeObserver?.observe(this.canvas);
  }

  _pointerFromEvent(event) {
    const box = this.canvas.getBoundingClientRect();
    this.pointer.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);
  }

  _pick() {
    if (this.disposed || !this.camera) return null;
    if (this.inspectionClip) {
      const x=(this.pointer.x+1)*this.width/2,y=(1-this.pointer.y)*this.height/2,c=this.inspectionClip;
      if (x<c.left||x>c.right||y<c.top||y>c.bottom) return null;
    }
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const meshes = [...this.entries.values()].filter(entry => entry.group.visible && entry.visibility > .2 && entry.loaded).map(entry => entry.art);
    const hits = this.raycaster.intersectObjects(meshes,false);
    for (const hit of hits) {
      const entry = this.entries.get(hit.object.userData.productId);
      const alpha = entry.texture?.alpha;
      if (alpha && hit.uv) {
        const x = clamp(Math.floor(hit.uv.x * alpha.width),0,alpha.width-1);
        const y = clamp(Math.floor((1-hit.uv.y) * alpha.height),0,alpha.height-1);
        if (alpha.data[(y*alpha.width+x)*4+3] < 30) continue;
      }
      return entry;
    }
    return null;
  }

  _setHover(entry) {
    if (this.hovered === entry) return;
    if (this.hovered) this.hovered.hoverTarget=0;
    this.hovered=entry;
    if (entry) entry.hoverTarget=1;
    if (!this.drag) this.canvas.style.cursor=entry?'pointer':'grab';
  }

  _updateHover() {this._setHover(this._pick());}

  get selectedProduct() {return this.visibleProducts[this.selectedIndex] || null;}

  _meta() {
    const pageSize = this.mobile ? 4 : 10;
    const selected=this.entries.get(this.selectedProduct?.id);
    return {id:this.selectedProduct?.id,color:selected?.requestedColor||selected?.currentColor,category:this.category,index:this.selectedIndex,count:this.visibleProducts.length,total:this.visibleProducts.length,mode:this.mode,garmentView:this.garmentView,page:this.page,pageCount:this.mode==='shelf'||(this.mode==='focus'&&this.shelfCategory)?Math.max(1,Math.ceil(this.visibleProducts.length/pageSize)):1};
  }

  _emitSelection(inspect = false) {
    if (!this.selectedProduct) return;
    this.callbacks.onSelect(this.selectedProduct,this._meta());
    if (inspect) this.callbacks.onInspect(this.selectedProduct,this._meta());
    this._queueLayout();
  }

  _queueLayout() {
    if (this.layoutFrame || this.disposed) return;
    this.layoutFrame=requestAnimationFrame(() => {
      this.layoutFrame=0;
      if (!this.disposed) this._layout();
    });
  }

  setCategory(category = 'Gaun Wanita') {
    if (this.disposed) return false;
    const next = ['all','Semua'].includes(category) ? 'Gaun Wanita' : category === 'shoes' ? 'Sepatu' : category;
    const list = next === 'Sepatu' ? this.products.filter(isShoe) : this.products.filter(product => product.category === next);
    if (!list.length) return false;
    this.category = next; this.visibleProducts = list;this.selectedIndex=0;this.page=0;
    this.garmentView='detail';this.garmentCenter=.4;
    const included = new Set(list.map(product => product.id));
    for (const entry of this.entries.values()) {
      if (included.has(entry.product.id)) continue;
      entry.targetVisible=false;entry.visibility=0;entry.group.visible=false;entry.material.opacity=0;
    }
    this._setHover(null);
    this.shelfCategory=list.every(isShoe);this.mode=this.shelfCategory?'shelf':'runway';
    this._layout();this._emitSelection();this._preloadRemaining();return true;
  }

  select(id) {
    if (this.disposed) return false;
    id=asId(id);
    let index=this.visibleProducts.findIndex(product=>product.id===id);
    if (index<0) {
      const product=this.products.find(product=>product.id===id);
      if (!product) return false;
      this.setCategory(product.category);index=this.visibleProducts.findIndex(product=>product.id===id);
    }
    if (index!==this.selectedIndex) {this.garmentView='detail';this.garmentCenter=.4;}
    this.selectedIndex=index;
    this.page=Math.floor(index/(this.mobile?4:10));
    const selected=this.entries.get(id);this._loadEntry(selected,selected.requestedColor||selected.currentColor||selected.product.colors?.[0]);
    this._layout();this._emitSelection(this.mode==='focus');return true;
  }

  inspect(id = this.selectedProduct?.id, view = 'detail') {
    if (this.disposed || !id) return false;
    if (asId(id)!==this.selectedProduct?.id && !this.select(id)) return false;
    this.garmentView=view==='full'&&!isShoe(this.selectedProduct)?'full':'detail';this.garmentCenter=.4;
    this.mode='focus';this._layout();this._emitSelection(true);return true;
  }

  setGarmentView(view) {
    if(this.disposed||this.mode!=='focus'||isShoe(this.selectedProduct)||!['detail','full'].includes(view)) return false;
    this.garmentView=view;this._layout();this._emitSelection(true);return true;
  }

  overview() {
    if (this.disposed) return;
    this.mode=this.shelfCategory?'shelf':'runway';this._layout();this._emitSelection();
  }

  setColor(id,color) {
    const entry=this.entries.get(asId(id));
    if (!entry || !entry.product.colors?.includes(color)) return Promise.resolve(false);
    return this._loadEntry(entry,color).then(result=>Boolean(result));
  }

  step(delta = 1) {
    if (this.disposed || !this.visibleProducts.length) return false;
    const next=(this.selectedIndex+Math.trunc(delta)+this.visibleProducts.length)%this.visibleProducts.length;
    return this.select(this.visibleProducts[next].id);
  }

  _layout(snap = false) {
    if (!this.camera || !this.visibleProducts.length) return;
    const selected=this.selectedProduct;
    const selectedEntry=this.entries.get(selected.id);
    const shelf=this.mode==='shelf';
    const focus=this.mode==='focus';
    this.activeUntil=performance.now()+1600;
    const pageSize=this.mobile?4:10;
    const columns=this.mobile?2:5;
    this.page=Math.floor(this.selectedIndex/pageSize);
    for (const entry of this.entries.values()) {
      entry.targetVisible=false;entry.targetScale=1;entry.targetRotation=0;entry.targetOpacity=1;entry.visibleIndex=-1;
      entry.pedestal.visible=entry.shoe;
    }
    this.visibleProducts.forEach((product,index)=>{
      const entry=this.entries.get(product.id);entry.visibleIndex=index;
      if (shelf) {
        const local=index-this.page*pageSize;
        if (local<0||local>=pageSize)return;
        const row=Math.floor(local/columns),column=local%columns;
        entry.targetPosition.set((column-(columns-1)/2)*2.28,row===0?2.15:.3,row===0?-.62:.25);
        entry.targetRotation=-.055;entry.targetScale=1;entry.targetVisible=true;entry.pedestal.visible=true;
      } else {
        let delta=index-this.selectedIndex;
        if (delta>this.visibleProducts.length/2)delta-=this.visibleProducts.length;
        if (delta<-this.visibleProducts.length/2)delta+=this.visibleProducts.length;
        entry.targetVisible=Math.abs(delta)<=3;
        const spread=focus?2.16:1.68;
        const x=delta*spread;
        const z=delta===0?(focus?.52:.2):-Math.abs(delta)*(focus?1.35:1.05)-Math.abs(delta)**2*.14;
        entry.targetPosition.set(x,0,z);
        entry.targetRotation=delta===0?0:-Math.sign(delta)*.31;
        entry.targetScale=delta===0?(focus?1.08:1):.9;
        entry.targetOpacity=delta===0?1:focus?.19:Math.abs(delta)===1?.66:.32;
        if (entry.shoe) {
          entry.targetPosition.y=0;
          if (focus&&delta===0)entry.targetScale=1.3;
        }
      }
      if (entry.targetVisible) this._loadEntry(entry,entry.requestedColor||entry.currentColor||product.colors?.[0]);
      if (snap) {
        entry.group.position.copy(entry.targetPosition);entry.group.rotation.y=entry.targetRotation;entry.group.scale.setScalar(entry.targetScale);
        entry.visibility=entry.targetVisible?1:0;
        entry.opacity=entry.targetOpacity;
      }
    });
    if (shelf) {
      const requiredWidth=columns*2.28+.5;
      const usableFraction=this.mobile?.52:.76;
      const requiredHeight=4.2/usableFraction;
      const vertical=Math.max(requiredHeight,requiredWidth/this.camera.aspect);
      const distance=vertical/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2)));
      this.lookTarget.set(0,1.95,0);this.cameraTarget.set(.12,2.85,Math.max(this.mobile?11.6:8.8,distance));
    } else if (focus&&selectedEntry.shoe) {
      const distance=this.mobile?9.4:5.25;
      this.lookTarget.set(0,.82,.25);this.cameraTarget.set(.25,1.75,distance);
    } else {
      const distance=this.mobile?(focus?13:13.4):(focus?7.6:8.25);
      this.lookTarget.set(0,1.65,0);this.cameraTarget.set(focus?.08:.24,2.34,distance);
    }
    const selectedPosition=selectedEntry.targetPosition;
    this.focusLightTarget.copy(selectedPosition).y+=selectedEntry.shoe?.7:1.8;
    if(this.width&&this.height) {
      const verticalOffset=this.mobile?(!shelf&&!selectedEntry.shoe?.14:.105):.025;
      const horizontalOffset=this.mobile||shelf?0:.085;
      this.camera.setViewOffset(this.width,this.height,this.width*horizontalOffset,this.height*verticalOffset,this.width,this.height);
      this.camera.updateProjectionMatrix();
    }
    if (this.mobile) this._fitCompactStage(shelf,focus,selectedEntry);
    else this._fitDesktopStage(shelf,focus,selectedEntry);
    const closeGarment=focus&&!selectedEntry.shoe&&this.garmentView==='detail';
    if (closeGarment) this._fitGarmentDetail(selectedEntry);
    this._setInspectionClip(closeGarment);
    if (snap || this.reducedMotion) {
      this.camera.position.copy(this.cameraTarget);this.lookCurrent.copy(this.lookTarget);this.camera.lookAt(this.lookCurrent);
    }
  }

  _fitGarmentDetail(entry) {
    // Inspect the garment itself, rather than fitting the full photographed body
    // again (which used to cancel the camera dolly). Vertical drag explores it.
    const c=this.stageBounds,stageWidth=c.right-c.left,stageHeight=c.bottom-c.top;
    const span=this.mobile?.27:.44;
    const scale=entry.targetScale,height=entry.height*scale;
    const width=(entry.width||2.2)*scale*(entry.product.category==='Jas Pria'?.9:.62);
    const tangent=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    const distance=Math.max(height*span/(2*tangent*stageHeight/this.height),width/(2*tangent*this.camera.aspect*stageWidth/this.width))*1.035;
    const centerY=(.018+entry.height*(1-this.garmentCenter))*scale;
    this.lookTarget.set(entry.targetPosition.x,centerY,entry.targetPosition.z);
    this.cameraTarget.set(entry.targetPosition.x,centerY+distance*.045,entry.targetPosition.z+distance);
  }

  _setInspectionClip(enabled) {
    this.inspectionClip=enabled?{...this.stageBounds}:null;
    for(const entry of this.entries.values()) {
      if(entry.shoe) continue;
      const planes=enabled?this.inspectionPlanes:null;
      if(entry.material.clippingPlanes!==planes) {
        entry.material.clippingPlanes=planes;
        // Retain the photographed subject's physical floor shadow.
        entry.material.clipShadows=false;entry.material.needsUpdate=true;
      }
    }
  }

  _updateInspectionPlanes() {
    const c=this.inspectionClip;
    if(!c) return;
    this.camera.updateMatrixWorld(true);
    const coordinates=[[c.left,c.top],[c.right,c.top],[c.right,c.bottom],[c.left,c.bottom]];
    coordinates.forEach(([x,y],index)=>this.inspectionCorners[index].set(x/this.width*2-1,1-y/this.height*2,.5).unproject(this.camera));
    this.inspectionCenter.set((c.left+c.right)/this.width-1,1-(c.top+c.bottom)/this.height,.5).unproject(this.camera);
    this.inspectionPlanes.forEach((plane,index)=>{
      plane.setFromCoplanarPoints(this.camera.position,this.inspectionCorners[index],this.inspectionCorners[(index+1)%4]);
      if(plane.distanceToPoint(this.inspectionCenter)<0)plane.negate();
    });
  }

  _fitDesktopStage(shelf,focus,entry) {
    const rect=selector=>{
      const element=document.querySelector(selector);
      if (!element) return null;
      const style=getComputedStyle(element),box=element.getBoundingClientRect();
      return style.display==='none'||style.visibility==='hidden'||Number(style.opacity)<.05||!box.height?null:box;
    };
    const header=rect('.showroom-header'),hud=rect('.product-hud'),pager=rect('.scene-pagination');
    const footer=rect('.showroom-footer'),intro=rect('.showroom-intro'),heading=rect('.shoe-scene-heading');
    const back=rect('#overviewButton');
    let left=this.width*.05,right=this.width*.95,top=(header?.bottom||100)+18;
    let bottom=Math.min(pager?.top||this.height-100,footer?.top||this.height-75)-18;
    if (shelf) {
      if (heading) top=Math.max(top,heading.bottom+20);
      if (hud) bottom=Math.min(bottom,hud.top-20);
    } else {
      if (hud) right=Math.min(right,hud.left-24);
      if (focus) {
        if (back) top=Math.max(top,back.bottom+14);
      } else if (intro) {
        const side=getComputedStyle(document.querySelector('.showroom-intro')).getPropertyValue('--intro-layout').trim()==='left';
        if (side) left=Math.max(left,intro.right+24);
        else top=Math.max(top,intro.bottom+20);
      }
    }
    // Bounds are measured after the HUD has flowed, including browser zoom and fonts.
    right=Math.max(left+120,right);bottom=Math.max(top+90,bottom);
    this.stageBounds={left,top,right,bottom};
    const bounds=new THREE.Box3();
    const entries=shelf?[...this.entries.values()].filter(item=>item.targetVisible):[entry];
    for (const item of entries) {
      const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),item.targetRotation);
      const matrix=new THREE.Matrix4().compose(item.targetPosition,rotation,new THREE.Vector3().setScalar(item.targetScale));
      const base=item.shoe?.115:.018;
      const width=item.width||(item.shoe?1.85:2.2),height=item.loaded?item.height:item.shoe?.98:3.35;
      for(const x of [-width/2,width/2])for(const y of [base,base+height]){
        bounds.expandByPoint(new THREE.Vector3(x,y,0).applyMatrix4(matrix));
      }
      if (item.shoe) for(const x of [-1.04,1.04])for(const y of [0,.102])for(const z of [-.47,.48]){
        bounds.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(matrix));
      }
    }
    const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const tangent=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    const distance=Math.max(size.y/(2*tangent*(bottom-top)/this.height),size.x/(2*tangent*this.camera.aspect*(right-left)/this.width))*(focus?1.1:1.2)+size.z*.5;
    this.lookTarget.copy(center);
    this.cameraTarget.set(center.x,center.y+distance*.045,center.z+distance);
    this.camera.setViewOffset(this.width,this.height,this.width*.5-(left+right)/2,this.height*.5-(top+bottom)/2,this.width,this.height);
    this.camera.updateProjectionMatrix();
  }

  _fitCompactStage(shelf,focus,entry) {
    // Fit the photographed subject into the actual space between the mobile HUDs.
    // This also handles browser chrome, large text and the short landscape layout.
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
    const header=rect('.showroom-header'),hud=rect('.product-hud');
    const pagination=rect('.scene-pagination');
    const greeting=this.landscape?rect('.stylist-greeting:not([hidden])'):null;
    let left=16,right=this.width-16,top=(header?.bottom||120)+12;
    let bottom=Math.min(this.height-95,pagination?.top-12||this.height-95);
    if (this.landscape) {
      right=Math.min(right,(hud?.left||this.width*.58)-18);
      if (greeting) bottom=Math.min(bottom,greeting.top-12);
    } else {
      bottom=Math.min(bottom,(hud?.top||this.height-250)-14);
    }
    const title=rect(focus?'#overviewButton':this.shelfCategory?'.shoe-scene-heading':'.showroom-intro');
    if (title?.height) top=Math.max(top,title.bottom+10);
    bottom=Math.max(top+(greeting?44:80),bottom);
    const stageWidth=Math.max(100,right-left),stageHeight=bottom-top;
    const worldHeight=shelf?3.75:(entry.height||3.35)*entry.targetScale+(entry.shoe?.16:.05);
    const worldWidth=shelf?4.65:Math.max((entry.width||2.2)*entry.targetScale,entry.shoe?2.85:1.4);
    const tangent=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    const distance=Math.max(worldHeight/(2*tangent*stageHeight/this.height),worldWidth/(2*tangent*this.camera.aspect*stageWidth/this.width))*1.09;
    const centerY=shelf?1.87:entry.targetPosition.y+worldHeight/2;
    const centerZ=shelf?-.1:entry.targetPosition.z;
    this.lookTarget.set(0,centerY,centerZ);
    this.cameraTarget.set(0,centerY+distance*.045,centerZ+distance);
    this.camera.setViewOffset(this.width,this.height,this.width*.5-(left+right)/2,this.height*.5-(top+bottom)/2,this.width,this.height);
    this.camera.updateProjectionMatrix();
    this.stageBounds={left,top,right,bottom};
  }

  resize() {
    if (this.disposed || !this.renderer) return;
    const box=this.canvas.getBoundingClientRect();
    const width=Math.max(1,Math.round(box.width||this.canvas.clientWidth||innerWidth));
    const height=Math.max(1,Math.round(box.height||this.canvas.clientHeight||innerHeight));
    if (this.width===width&&this.height===height)return;
    this.width=width;this.height=height;this.landscape=height<=550&&width<=950&&width>height;
    this.mobile=width<=800||this.landscape;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.mobile?1.5:2));
    const shadowSize=this.mobile?1024:2048;
    if (this.keyLight.shadow.mapSize.x!==shadowSize) {
      this.keyLight.shadow.mapSize.set(shadowSize,shadowSize);
      this.keyLight.shadow.map?.dispose();this.keyLight.shadow.map=null;
    }
    this.renderer.setSize(width,height,false);
    this.camera.aspect=width/height;
    // This is a camera frustum shift: the actual scene keeps the UI's clear area free.
    this.camera.setViewOffset(width,height,this.mobile?0:width*.085,height*(this.mobile?.105:.025),width,height);
    this.camera.updateProjectionMatrix();this._layout();
  }

  _tick(time) {
    if (this.disposed)return;
    this.frame=requestAnimationFrame(next=>this._tick(next));
    if (this.contextLost||document.hidden)return;
    // Keep flights at display rate; a stationary phone showroom needs half the work.
    if (this.mobile && time>this.activeUntil && time-this.lastTime<32) return;
    const dt=this.lastTime?Math.min((time-this.lastTime)/1000,.05):1/60;this.lastTime=time;
    const response=this.reducedMotion?1:1-Math.exp(-dt*7.1);
    const camResponse=this.reducedMotion?1:1-Math.exp(-dt*5.2);
    this.cameraSway.multiplyScalar(Math.exp(-dt*5));
    const cameraGoal=this.cameraGoal.copy(this.cameraTarget);
    if (!this.reducedMotion)cameraGoal.x+=this.cameraSway.x;
    this.camera.position.lerp(cameraGoal,camResponse);this.lookCurrent.lerp(this.lookTarget,camResponse);this.camera.lookAt(this.lookCurrent);
    const selectedId=this.selectedProduct?.id;
    for (const entry of this.entries.values()) {
      entry.visibility=THREE.MathUtils.lerp(entry.visibility,entry.targetVisible?1:0,response);
      entry.group.visible=entry.visibility>.012;
      if (!entry.group.visible)continue;
      entry.hover=THREE.MathUtils.lerp(entry.hover,entry.hoverTarget,response);
      const target=entry.targetPosition;
      const goalY=target.y+(entry.shoe?0:.035)*entry.hover;
      entry.group.position.x=THREE.MathUtils.lerp(entry.group.position.x,target.x,response);
      entry.group.position.y=THREE.MathUtils.lerp(entry.group.position.y,goalY,response);
      entry.group.position.z=THREE.MathUtils.lerp(entry.group.position.z,target.z,response);
      if(entry.artBaseY)entry.art.position.y=entry.artBaseY+(entry.shoe?.085:0)*entry.hover;
      entry.group.rotation.y=THREE.MathUtils.lerp(entry.group.rotation.y,entry.targetRotation,response);
      const scale=THREE.MathUtils.lerp(entry.group.scale.x,entry.targetScale,response);entry.group.scale.setScalar(scale);
      entry.opacity=THREE.MathUtils.lerp(entry.opacity,entry.targetOpacity,response);
      entry.material.opacity=entry.visibility*entry.opacity;
      entry.shadowMaterial.opacity=entry.visibility*entry.opacity*(entry.product.id===selectedId?.62:.36);
      entry.pedestalMaterials.forEach(material=>{material.opacity=entry.visibility*entry.opacity;material.depthWrite=entry.targetOpacity>.5;});
      const active=entry.product.id===selectedId;
      entry.glowMaterial.emissiveIntensity=THREE.MathUtils.lerp(entry.glowMaterial.emissiveIntensity,active?1.1:.2+entry.hover*.55,response);
    }
    this.focusLight.target.position.lerp(this.focusLightTarget,response);
    this.focusLight.position.x=THREE.MathUtils.lerp(this.focusLight.position.x,this.focusLightTarget.x-1,response);
    this.focusLight.intensity=THREE.MathUtils.lerp(this.focusLight.intensity,this.mode==='focus'?15:7,response);
    this._updateInspectionPlanes();
    this.renderer.render(this.scene,this.camera);this.renderedFrames++;
    if (this.contextRecoveryPending) {
      this.contextRecoveryPending = false;
      this.callbacks.onContextRecovered();
    }
    if (matchMedia('(hover:hover)').matches&&this._isPointerInside&&!this.drag&&this.renderedFrames%5===0&&!this._blocked())this._updateHover();
  }

  getScreenPosition(id) {
    const entry=this.entries.get(asId(id));
    if (!entry)return null;
    this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
    // Find an opaque point nearest the image centre, so automated clicks hit fabric.
    let u=.5,v=.5;
    const alpha=entry.texture?.alpha;
    if (alpha) {
      let closest=Infinity;
      for(let y=0;y<alpha.height;y+=2)for(let x=0;x<alpha.width;x+=2){
        if(alpha.data[(y*alpha.width+x)*4+3]<180)continue;
        const distance=(x/alpha.width-.5)**2+(y/alpha.height-.46)**2;
        if(distance<closest){closest=distance;u=(x+.5)/alpha.width;v=1-(y+.5)/alpha.height;}
      }
    }
    const point=entry.art.localToWorld(new THREE.Vector3(u-.5,v-.5,.015));
    const ndc=point.project(this.camera);const box=this.canvas.getBoundingClientRect();
    return {id:entry.product.id,x:box.left+(ndc.x+1)/2*box.width,y:box.top+(1-ndc.y)/2*box.height,visible:entry.group.visible&&entry.loaded&&ndc.z<1&&Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1,ndc:{x:ndc.x,y:ndc.y,z:ndc.z},mode:this.mode};
  }

  getDebugState() {
    if (!this.renderer)return {disposed:this.disposed};
    const objectTypes={};this.scene.traverse(object=>{objectTypes[object.type]=(objectTypes[object.type]||0)+1;});
    return {
      engine:'three.js',revision:THREE.REVISION,webgl:true,ready:this.ready,disposed:this.disposed,contextLost:Boolean(this.contextLost),
      category:this.category,mode:this.mode,garmentView:this.garmentView,inspectionClip:this.inspectionClip,selectedId:this.selectedProduct?.id,selectedIndex:this.selectedIndex,
      productCount:this.products.length,filteredCount:this.visibleProducts.length,page:this.page,pageCount:this._meta().pageCount,
      viewport:{width:this.width,height:this.height,pixelRatio:this.renderer.getPixelRatio(),mobile:this.mobile,landscape:this.landscape,stage:this.stageBounds},
      camera:{position:this.camera.position.toArray(),target:this.cameraTarget.toArray(),lookAt:this.lookCurrent.toArray(),projection:this.camera.projectionMatrix.toArray()},
      springState:{method:'frame-rate-independent exponential damping',cameraDistance:this.camera.position.distanceTo(this.cameraTarget),activeProductDistance:this.entries.get(this.selectedProduct?.id)?.group.position.distanceTo(this.entries.get(this.selectedProduct?.id)?.targetPosition)||0},
      renderer:{calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,points:this.renderer.info.render.points,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,frames:this.renderedFrames},
      scene:{objects:objectTypes,fog:{type:this.scene.fog.isFogExp2?'FogExp2':this.scene.fog.constructor.name,density:this.scene.fog.density},floorReceivesShadow:true,shadowMap:this.renderer.shadowMap.enabled,shadowType:this.renderer.shadowMap.type},
      products:[...this.entries.values()].map(entry=>({id:entry.product.id,visible:entry.group.visible,loaded:entry.loaded,color:entry.currentColor,requestedColor:entry.requestedColor,texture:entry.texture?.url,position:entry.group.position.toArray(),target:entry.targetPosition.toArray(),rotation:entry.group.rotation.y,scale:entry.group.scale.x,opacity:entry.material.opacity,targetOpacity:entry.targetOpacity,hover:entry.hover,hoverTarget:entry.hoverTarget,hoverLift:entry.art.position.y-(entry.artBaseY||entry.art.position.y),glowIntensity:entry.glowMaterial.emissiveIntensity,pedestal:entry.pedestal.visible&&entry.group.visible,castShadow:entry.art.castShadow,alphaDepth:Boolean(entry.depth.map),size:{width:entry.width,height:entry.height}}))
    };
  }

  dispose() {
    if(this.disposed)return;
    this.disposed=true;cancelAnimationFrame(this.frame);cancelAnimationFrame(this.layoutFrame);this.listeners.forEach(remove=>remove());this.listeners=[];
    this.resizeObserver?.disconnect();this._setHover(null);
    this.geometries.forEach(geometry=>geometry.dispose());this.materials.forEach(material=>material.dispose());
    this.contactTexture?.dispose();this.textureCache.forEach(promise=>promise.then(asset=>asset?.texture?.dispose()).catch(noop));this.textureCache.clear();
    this.proceduralTextures.forEach(texture=>texture.dispose());this.proceduralTextures.clear();
    this.renderer?.dispose();this.entries.clear();this.scene?.clear();
  }
}
