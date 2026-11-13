/* Local review configuration only. UI notices are rendered by the new HUD. */
(() => {
  if(!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))return;
  window.YASHBI_LOCAL_PREVIEW=true;
  window.YASHBI_CONFIG={...(window.YASHBI_CONFIG||{}),apiUrl:`${location.origin}/__preview/api`};
})();
