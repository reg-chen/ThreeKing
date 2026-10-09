// Measure the smallest browser viewport with no document-level horizontal overflow.
// Run against the checked-out HTML, not the deployed site.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const { resolve, appendFileSync } = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:400,height:800},deviceScaleFactor:1});
  try {
    await page.goto(pathToFileURL(resolve('index.html')).href,{waitUntil:'load'});
    let width = 640;
    for(let candidate=360;candidate<=640;candidate+=10){
      await page.setViewportSize({width:candidate,height:900});
      const overflow=await page.evaluate(() => {
        const root=document.documentElement, body=document.body;
        return Math.max(root.scrollWidth,body.scrollWidth)-root.clientWidth;
      });
      if(overflow<=1){width=candidate;break;}
    }
    await page.setViewportSize({width,height:900});
    const contentHeight=await page.evaluate(()=>Math.ceil(Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)));
    // The app remains scrollable on smaller displays; avoid an off-screen window.
    const height=Math.min(900,Math.max(580,contentHeight+32));
    console.log(JSON.stringify({width,height,contentHeight}));
    appendFileSync(process.env.GITHUB_ENV,`PAKE_WIDTH=${width}\nPAKE_HEIGHT=${height}\n`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
