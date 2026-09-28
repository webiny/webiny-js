/**
 * The in-page script that decides a composed page has finished rendering.
 *
 * `domcontentloaded` and even network idle are both too early here. A Website Builder page mounts its
 * remote components after the document settles, so a camera fired on either signal photographs a blank
 * or half-built page — which in a comparison harness reads as a migration failure rather than a timing
 * one, and that is the one mistake this tool must not make.
 *
 * So readiness is measured from the page itself: the document stops growing and its images have
 * settled. Run through the capture provider's `evaluate` seam, which happens after the overlay passes
 * and before the screenshots, so waiting here delays the camera too.
 */
export const readinessScript = ({ stableTicks = 3, tickMs = 400, timeoutMs = 45000 } = {}) => `
    (async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const started = Date.now();

        let lastHeight = -1;
        let stable = 0;

        while (Date.now() - started < ${timeoutMs}) {
            const height = document.documentElement.scrollHeight;
            const images = Array.from(document.images);
            const pending = images.filter(img => !img.complete).length;

            if (height === lastHeight && pending === 0 && height > 0) {
                stable++;
                if (stable >= ${stableTicks}) {
                    break;
                }
            } else {
                stable = 0;
                lastHeight = height;
            }
            await sleep(${tickMs});
        }

        const images = Array.from(document.images);

        return {
            title: document.title,
            height: document.documentElement.scrollHeight,
            width: document.documentElement.scrollWidth,
            textLength: (document.body.innerText || "").trim().length,
            images: images.length,
            brokenImages: images.filter(img => img.complete && img.naturalWidth === 0).length,
            sections: document.querySelectorAll("section, header, footer").length,
            settledInMs: Date.now() - started,
            /*
             * Whether it ever settled, rather than ran out of time. A page that hit the ceiling is
             * reported as such instead of being quietly treated as finished.
             */
            settled: stable >= ${stableTicks}
        };
    })()
`;
