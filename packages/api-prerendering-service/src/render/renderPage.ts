import chromium from "chrome-aws-lambda";
import posthtml from "posthtml";
import { noopener } from "posthtml-noopener";
import injectApolloState from "./injectApolloState";
import injectRenderId from "./injectRenderId";
import injectRenderTs from "./injectRenderTs";
import getPsTags from "./getPsTags";
import shortid from "shortid";

const windowSet = (page, name, value) => {
    page.evaluateOnNewDocument(`
    Object.defineProperty(window, '${name}', {
      get() {
        return '${value}'
      }
    })`);
};

export type File = { type: string; body: any; name: string; meta: Record<string, any> };

let browser;
export default async (url: string, { log }): Promise<File[]> => {
    const renderId = shortid.generate();
    const renderTs = new Date().getTime();

    log(`Rendering "${url}" (render ID: ${renderId})...`);
    if (!browser) {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true
        });
    }

    const browserPage = await browser.newPage();

    // Currently, this variable is not used but lets keep it here as an example of setting page window variables.
    windowSet(browserPage, "__PS_RENDER__", true);

    // Don't load these resources during prerender.
    const skipResources = ["image", "stylesheet"];
    await browserPage.setRequestInterception(true);

    const gqlCache = [];

    browserPage.on("request", request => {
        if (skipResources.includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    });

    // TODO: should be a plugin
    browserPage.on("response", async response => {
        const request = response.request();
        const url = request.url();
        if (url.includes("/graphql") && request.method() === "POST") {
            const responses = await response.json();
            const postData = JSON.parse(request.postData());
            const operations = Array.isArray(postData) ? postData : [postData];

            for (let i = 0; i < operations.length; i++) {
                const { operationName, query, variables } = operations[i];

                if (operationName === "PbGetPublishedPage") {
                    gqlCache.push({
                        query,
                        variables,
                        data: responses[i].data
                    });
                }

            }
            return;
        }
    });

    // Load URL and wait for all network requests to settle.
    await browserPage.goto(url, { waitUntil: "networkidle0" });

    // Process HTML.
    // TODO: should be plugins.
    log("Processing HTML...");
    const { html } = await posthtml([
        noopener(),
        injectRenderId(browserPage, { log, renderId }),
        injectRenderTs(browserPage, { log, renderTs }),
        injectApolloState(browserPage, { log }),
    ]).process(await browserPage.content());
    log("Processing HTML done.");

    log(`Rendering "${url}" completed.`);

    // TODO: should be plugins.
    return [
        {
            name: "index.html",
            body: html,
            type: "text/html",
            meta: {
                tags: getPsTags(html)
            }
        },
        {
            name: "graphql.json",
            body: JSON.stringify(gqlCache),
            type: "application/json",
            meta: {}
        }
    ];
};
