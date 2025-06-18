const puppeteer = require('puppeteer');

async function scrapeKenalAdmin() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to production site...');
    await page.goto('https://kenal-admin.netlify.app/', { waitUntil: 'networkidle2' });
    
    // Wait for the app to load
    await page.waitForTimeout(3000);
    
    // Check if we're on login page
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('2. Found login page, attempting to login...');
      
      // Fill in login credentials
      await page.type('input[type="email"]', 'neo@todak.com');
      await page.type('input[type="password"]', 'password');
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);
    }
    
    console.log('3. Extracting menu items...');
    
    // Extract sidebar menu items
    const menuItems = await page.evaluate(() => {
      const items = [];
      const menuElements = document.querySelectorAll('[class*="MuiListItem"]');
      
      menuElements.forEach(el => {
        const text = el.textContent?.trim();
        const icon = el.querySelector('svg')?.innerHTML;
        if (text && text !== 'Logout') {
          items.push({ text, hasIcon: !!icon });
        }
      });
      
      return items;
    });
    
    console.log('4. Menu items found:', menuItems);
    
    // Extract page structure
    const pageStructure = await page.evaluate(() => {
      const structure = {
        hasHeader: !!document.querySelector('[class*="MuiAppBar"]'),
        hasSidebar: !!document.querySelector('[class*="MuiDrawer"]'),
        headerContent: document.querySelector('[class*="MuiAppBar"]')?.textContent,
        mainContent: document.querySelector('main')?.innerHTML?.substring(0, 500)
      };
      return structure;
    });
    
    console.log('5. Page structure:', pageStructure);
    
    // Take screenshots of different pages
    const pages = ['/dashboard', '/users', '/analytics', '/content', '/feedback', '/settings'];
    
    for (const pagePath of pages) {
      try {
        console.log(`6. Navigating to ${pagePath}...`);
        await page.goto(`https://kenal-admin.netlify.app${pagePath}`, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        const pageContent = await page.evaluate(() => {
          return {
            title: document.querySelector('h4, h5, h6')?.textContent,
            hasTable: !!document.querySelector('table'),
            hasCharts: !!document.querySelector('canvas'),
            buttonTexts: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean)
          };
        });
        
        console.log(`   - ${pagePath} content:`, pageContent);
      } catch (err) {
        console.log(`   - Error accessing ${pagePath}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
}

scrapeKenalAdmin();
