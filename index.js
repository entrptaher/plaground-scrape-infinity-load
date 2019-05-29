const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://www.producthunt.com", { waitUntil: "networkidle0" });

  const productList = await page.evaluate(async function infinityLoader() {
    const delay = d => new Promise(r => setTimeout(r, d));

    const scrollAndExtract = async (selector, leaf, remove) => {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView();
        if (remove) return element.remove(); // <-- Remove and exit
        return element[leaf];
      }
    };

    async function extractor() {
      const title = await scrollAndExtract(".title_9ddaf", "innerText");
      const img = await scrollAndExtract(
        '[data-test="post-thumbnail"] img',
        "src"
      );

      // remove the parent here
      await scrollAndExtract("div.white_09016 ul li", null, true);
      return { title, img };
    }

    const products = [];
    async function hundredProducts() {
      if (products.length < 100) {
        await delay(500);
        window.scrollTo(0, 0);

        const data = await extractor();
        if (!data.title || !data.img) return null;

        products.push(data);
        return hundredProducts();
      }
    }

    // run the function to grab data
    await hundredProducts();

    // and return the product from inside the page
    return products;
  });

  console.log(productList);

  await browser.close();
})();
