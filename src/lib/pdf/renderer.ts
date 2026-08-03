/**
 * PDF rendering seam.
 *
 * docs/BUILD_PLAN.md Section 7.2 calls for headless Chromium. Two hosting
 * shapes are supported, because MVP hosting (a temporary Vercel preview) and
 * eventual hosting (a container on a connectthedots.co.nz subdomain, see
 * docs/DEPLOYMENT.md) obtain Chromium differently:
 *
 * - A container/VPS has Chromium installed on disk — `createChromiumRenderer`
 *   points puppeteer-core at it directly.
 * - Vercel's serverless runtime has no Chromium and can't apt-install one, so
 *   `createServerlessRenderer` uses @sparticuz/chromium, a Chromium build
 *   compiled to fit the deployment size limit, unpacked into /tmp at cold
 *   start.
 *
 * Callers ask for a `PdfRenderer` and never touch puppeteer or the hosting
 * detail directly.
 */

export type PdfRenderer = {
  readonly name: string;
  /** Renders a complete HTML document to a PDF buffer. */
  render(html: string): Promise<Buffer>;
};

export class PdfNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfNotConfiguredError";
  }
}

/**
 * Chromium locations tried when CHROMIUM_PATH / PUPPETEER_EXECUTABLE_PATH
 * aren't set. Covers the usual Debian/Alpine package paths plus the
 * Playwright cache, which is what CI images tend to have.
 */
const CHROMIUM_CANDIDATES = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/opt/pw-browsers/chromium",
];

async function findChromium(): Promise<string> {
  const configured = (
    process.env.CHROMIUM_PATH ??
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    ""
  ).trim();

  const { access } = await import("node:fs/promises");

  // A configured-but-wrong path is checked too: otherwise a typo surfaces as
  // an opaque puppeteer launch failure instead of "that binary isn't there".
  if (configured) {
    try {
      await access(configured);
      return configured;
    } catch {
      throw new PdfNotConfiguredError(
        `CHROMIUM_PATH points at “${configured}”, which doesn't exist on this host.`
      );
    }
  }

  for (const candidate of CHROMIUM_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try the next one
    }
  }

  throw new PdfNotConfiguredError(
    "No Chromium binary found for PDF export. Set CHROMIUM_PATH to a Chromium/Chrome executable. See .env.example."
  );
}

/**
 * Local/containerised Chromium via puppeteer-core.
 *
 * A browser is launched per render and closed again. That's the honest
 * trade-off for now: slower per PDF, but no long-lived browser to leak
 * between serverless invocations. Worth revisiting once report volume is
 * real and the hosting target is settled.
 */
async function createChromiumRenderer(): Promise<PdfRenderer> {
  const executablePath = await findChromium();
  const puppeteer = await import("puppeteer-core");

  return {
    name: "chromium",
    async render(html) {
      const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        // Chromium's sandbox needs kernel privileges most containers withhold.
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
      });

      try {
        const page = await browser.newPage();
        // No network fetches happen — the document inlines its own styles —
        // so waiting on "load" is enough and can't hang on a third party.
        await page.setContent(html, { waitUntil: "load" });
        const pdf = await page.pdf({
          format: "a4",
          printBackground: true,
          preferCSSPageSize: true,
        });
        return Buffer.from(pdf);
      } finally {
        await browser.close();
      }
    },
  };
}

/**
 * Serverless Chromium via @sparticuz/chromium, for Vercel (or any AWS-Lambda-
 * shaped runtime). The package ships a compressed Chromium build and unpacks
 * it into /tmp on cold start — puppeteer-core points at that path instead of
 * an OS package.
 */
async function createServerlessRenderer(): Promise<PdfRenderer> {
  const [chromium, puppeteer] = await Promise.all([
    import("@sparticuz/chromium"),
    import("puppeteer-core"),
  ]);

  return {
    name: "serverless-chromium",
    async render(html) {
      const executablePath = await chromium.default.executablePath();
      const browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: chromium.default.args,
      });

      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load" });
        const pdf = await page.pdf({
          format: "a4",
          printBackground: true,
          preferCSSPageSize: true,
        });
        return Buffer.from(pdf);
      } finally {
        await browser.close();
      }
    },
  };
}

/**
 * `PDF_RENDERER` picks the implementation explicitly. Left unset, Vercel's own
 * `VERCEL=1` env var (present in every Vercel deployment, no configuration
 * needed) picks the serverless renderer automatically — so a Vercel preview
 * gets working PDF export with zero PDF-specific setup, and a container
 * deploy that sets nothing gets the plain Chromium path.
 */
export async function getPdfRenderer(): Promise<PdfRenderer> {
  const configured = (
    process.env.PDF_RENDERER ??
    (process.env.VERCEL ? "serverless-chromium" : "chromium")
  )
    .trim()
    .toLowerCase();

  switch (configured) {
    case "chromium":
      return createChromiumRenderer();
    case "serverless-chromium":
    case "vercel":
      return createServerlessRenderer();
    default:
      throw new PdfNotConfiguredError(`Unknown PDF_RENDERER “${configured}”.`);
  }
}
