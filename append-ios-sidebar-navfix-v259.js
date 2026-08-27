const fs=require('fs');const path=require('path');const out=path.join(__dirname,'public');const htmlPath=path.join(out,'index.html');let html=fs.readFileSync(htmlPath,'utf8');
for(const f of ['ui-ios-sidebar-navfix-v259.css'])fs.copyFileSync(path.join(__dirname,f),path.join(out,'css',f));
for(const f of ['ui-ios-sidebar-navfix-v259.js'])fs.copyFileSync(path.join(__dirname,f),path.join(out,'js',f));
if(!html.includes('ui-ios-sidebar-navfix-v259.css'))html=html.replace('</head>','<link rel="stylesheet" href="css/ui-ios-sidebar-navfix-v259.css?v=259">\n</head>');
if(!html.includes('ui-ios-sidebar-navfix-v259.js'))html=html.replace('</body>','<script src="js/ui-ios-sidebar-navfix-v259.js?v=259" defer></script>\n</body>');

/* iPhone Safari identity hardening: keep one explicit Apple touch source and strong fallbacks. */
html=html.replace(/^\s*<link\b[^>]*\brel=["']apple-touch-icon(?:-precomposed)?["'][^>]*>\s*$/gmi,'');
const appleTags='  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicons/ar-hanger-final-v5-180.png?v=259">\n  <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/assets/favicons/ar-hanger-final-v5-180.png?v=259">\n  <link rel="shortcut icon" type="image/x-icon" href="/favicon-ar-hanger-final-v5.ico?v=259">\n';
html=html.replace('</head>',appleTags+'</head>');
html=html.replace(/<meta\s+name=["']apple-mobile-web-app-title["'][^>]*>/gi,'<meta name="apple-mobile-web-app-title" content="ARSTORE">');

const manifestPath=path.join(out,'site.webmanifest');
if(fs.existsSync(manifestPath)){
  let m;try{m=JSON.parse(fs.readFileSync(manifestPath,'utf8'))}catch(_){m={name:'ARSTORE Tools V3',short_name:'ARSTORE'}}
  m.name='ARSTORE Tools V3';m.short_name='ARSTORE';
  const icons=Array.isArray(m.icons)?m.icons:[];
  const keep=icons.filter(i=>i&&i.src&&!/ar-hanger-final-v5-180\.png/.test(i.src));
  keep.push({src:'/assets/favicons/ar-hanger-final-v5-180.png?v=259',sizes:'180x180',type:'image/png',purpose:'any'});
  m.icons=keep;fs.writeFileSync(manifestPath,JSON.stringify(m,null,2));
}

for(const req of ['ui-ios-sidebar-navfix-v259.css','ui-ios-sidebar-navfix-v259.js','ar-hanger-final-v5-180.png?v=259'])if(!html.includes(req))throw new Error('V259 gate missing '+req);
fs.writeFileSync(htmlPath,html);
console.log('IOS V259 APPLIED — sidebar blur fix + light header separation + logo visibility + Safari favicon hardening; UI only');
