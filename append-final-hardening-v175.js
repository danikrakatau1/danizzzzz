const fs=require('fs'),path=require('path');
const ROOT=process.cwd(),OUT=path.join(ROOT,'public');
const copies=[
  ['css/final-visual-hardening-v130.css','css/final-visual-hardening-v130.css'],
  ['css/final-release-hardening-v175.css','css/final-release-hardening-v175.css'],
  ['js/final-visual-hardening-v130.js','js/final-visual-hardening-v130.js'],
  ['js/final-release-hardening-v175.js','js/final-release-hardening-v175.js']
];
for(const [src,rel] of copies){const from=path.join(ROOT,src),to=path.join(OUT,rel);if(!fs.existsSync(from))throw new Error('missing '+src);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to)}
const htmlPath=path.join(OUT,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
const css='  <link rel="stylesheet" href="css/final-visual-hardening-v130.css?v=3.4.175" />\n  <link rel="stylesheet" href="css/final-release-hardening-v175.css?v=3.4.175" />\n';
const js='  <script src="js/final-visual-hardening-v130.js?v=3.4.175"></script>\n  <script src="js/final-release-hardening-v175.js?v=3.4.175"></script>\n';
if(!html.includes('final-visual-hardening-v130.css')) html=html.replace('</head>',css+'</head>');
if(!html.includes('final-visual-hardening-v130.js')) html=html.replace('</body>',js+'</body>');
fs.writeFileSync(htmlPath,html);
for(const needle of ['final-visual-hardening-v130.css','final-release-hardening-v175.css','final-visual-hardening-v130.js','final-release-hardening-v175.js'])if(!html.includes(needle))throw new Error('hardening injection failed '+needle);
console.log('FINAL HARDENING V175 DEPLOY PATCH PASS · #54–#175');
