const fs=require('fs');
const cssFile='ui-mobile-viewport-hotfix-v34.css';
const out='public/css/app.css';
const css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('V3.4 MOBILE VIEWPORT + LIGHT THEME HOTFIX'))throw new Error('mobile hotfix marker missing');
if(!fs.existsSync(out))throw new Error('built app.css missing');
fs.appendFileSync(out,'\n'+css+'\n');
console.log('V3.4 mobile viewport/light-theme hotfix appended');
