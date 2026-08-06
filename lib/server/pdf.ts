import "server-only";

import { type Browser, chromium } from "playwright-core";

import type { PageFormat } from "@/lib/types/pdf";

const PAGE_DIMENSIONS: Record<PageFormat, { width: string; height: string }> = {
  A4: { width: "210mm", height: "297mm" },
  A5: { width: "148mm", height: "210mm" },
  LETTER: { width: "8.5in", height: "11in" },
  LEGAL: { width: "8.5in", height: "14in" },
};

// Reused across requests — launching Chromium is expensive. Requires the
// Chromium binary to be installed (`npx playwright install chromium`).
let _browser: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({
      headless: true,
      // --disable-dev-shm-usage avoids Chromium crashing in Docker, where
      // /dev/shm defaults to a tiny 64MB.
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return _browser;
}

// Playwright's headerTemplate/footerTemplate render header/footer in an
// isolated mini-document with no access to the main page's styles and are
// unreliable at loading remote images. `position: fixed` doesn't repeat per
// page in Chromium's print pipeline either (tested — only shows once).
// A <thead>/<tfoot> DOES repeat on every printed page and lives in the same
// document as the main content, so it shares its stylesheet/fonts/images and
// Chromium reserves the right amount of space for it automatically.
function composeDocument(html: string, headerHtml?: string | null, footerHtml?: string | null): string {
  // !important because template content is allowed to embed its own <style>
  // tag (e.g. `body { margin: 40px auto }`), which applies document-wide.
  // A body margin only affects the very start of the print flow — i.e. it
  // shows up as extra blank space above the header on page 1 only, since it
  // doesn't repeat per printed page like the table margin option does.
  const style = `<style>body{margin:0 !important;}table.akshar-pdf-frame{width:100%;border-collapse:collapse;}table.akshar-pdf-frame>thead>tr>td,table.akshar-pdf-frame>tfoot>tr>td{padding:0;}</style>`;
  if (!headerHtml && !footerHtml)
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${style}</head><body>${html}</body></html>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${style}</head><body><table class="akshar-pdf-frame">${
    headerHtml ? `<thead><tr><td>${headerHtml}</td></tr></thead>` : ""
  }${footerHtml ? `<tfoot><tr><td>${footerHtml}</td></tr></tfoot>` : ""}<tbody><tr><td>${html}</td></tr></tbody></table></body></html>`;
}

export async function renderHtmlToPdf(
  html: string,
  format: PageFormat,
  options: { headerHtml?: string | null; footerHtml?: string | null } = {},
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const documentHtml = composeDocument(html, options.headerHtml, options.footerHtml);
    await page.setContent(documentHtml, { waitUntil: "networkidle" });

    // page.setContent()'s networkidle can resolve before <img> decoding
    // finishes, silently dropping images from the PDF — wait explicitly.
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise<void>((resolve) => {
                img.addEventListener("load", () => resolve(), { once: true });
                img.addEventListener("error", () => resolve(), { once: true });
              }),
          ),
      ),
    );

    const { width, height } = PAGE_DIMENSIONS[format];

    return await page.pdf({
      width,
      height,
      printBackground: true,
      margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
    });
  } finally {
    await page.close();
  }
}
