import chromium from "chrome-aws-lambda";
import posthtml from "posthtml";
import { noopener } from "posthtml-noopener";
import injectApolloState from "./injectApolloState";
import injectApolloPrefetching from "./injectApolloPrefetching";
import path from "path";
import getPsTags from "./getPsTags";

const windowSet = (page, name, value) => {
    page.evaluateOnNewDocument(`
    Object.defineProperty(window, '${name}', {
      get() {
        return '${value}'
      }
    })`);
};

export type File = { type: string; body: any; name: string; meta: {} };

let browser;
export default async (url: string, { log }): Promise<File[]> => {
    log(`Rendering "${url}"`);
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
    windowSet(browserPage, "__WEBINY_PRERENDER__", true);

    // Keep track of all external requests made from the page.
    const requests = [];

    // Don't load these resources during prerender.
    const skipResources = ["image", "stylesheet"];
    await browserPage.setRequestInterception(true);

    const prefetchApolloState = [];
    const gqlCache = [];

    browserPage.on("request", request => {
        if (skipResources.includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
    });

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
                    prefetchApolloState.push(path.join(variables.path, "graphql.json"));
                }
                requests.push(`${url}: ${operationName} ${JSON.stringify(variables)}`);
                gqlCache.push({
                    query,
                    variables,
                    data: responses[i].data
                });
            }
            return;
        }
    });

    // Load URL and wait for all network requests to settle.
    await browserPage.goto(url, { waitUntil: "networkidle0" });

    // Process HTML
    log("Processing HTML");
    const { html } = await posthtml([
        noopener(),
        injectApolloState(browserPage, { log }),
        injectApolloPrefetching(prefetchApolloState, { log })
    ]).process(await browserPage.content());

    log("Done!");

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
