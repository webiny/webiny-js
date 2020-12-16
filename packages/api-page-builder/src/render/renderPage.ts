const puppeteer = require("puppeteer");
const posthtml = require("posthtml");
const { noopener } = require("posthtml-noopener");
const injectApolloState = require("./injectApolloState");
const injectApolloPrefetching = require("./injectApolloPrefetching");

const fileSafeId = url => {
    return "page--" + url.replace(/\//g, "-");
};

const windowSet = (page, name, value) => {
    page.evaluateOnNewDocument(`
    Object.defineProperty(window, '${name}', {
      get() {
        return '${value}'
      }
    })`);
};

export type File = { type: string; body: any; name: string };

export default async (url: string): Promise<File[]> => {
    const browser = await puppeteer.launch({ headless: true });

    console.log(`-> Rendering "${url}"`);
    const browserPage = await browser.newPage();

    // Currently, this variable is not used but lets keep it here as an example of setting page window variables.
    windowSet(browserPage, "__WEBINY_PRERENDER__", true);

    // Keep track of all external requests made from the page.
    const requests = [];

    // Don't load these resources during prerender.
    const skipResources = ["image", "stylesheet"];
    await browserPage.setRequestInterception(true);

    const prefetchApolloState = [];
    const apolloCache = [];

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
                    prefetchApolloState.push(`/cache/${fileSafeId(variables.url)}/apollo.json`);
                }
                requests.push(`${url}: ${operationName} ${JSON.stringify(variables)}`);
                apolloCache.push({
                    query,
                    variables,
                    data: responses[i].data
                });
            }
            return;
        }
        requests.push(url);
    });

    // Load URL and wait for all network requests to settle.
    await browserPage.goto(url, { waitUntil: "networkidle0" });

    // Process HTML
    console.log("-> Processing HTML");
    const { html } = await posthtml([
        noopener(),
        injectApolloState(browserPage),
        injectApolloPrefetching(prefetchApolloState)
    ]).process(await browserPage.content());

    const meta = { requests };

    console.log("-> Done!\n");

    return [
        {
            name: "index.html",
            body: html,
            type: "text/html"
        },
        {
            name: "graphql.json",
            body: JSON.stringify(apolloCache),
            type: "application/json"
        },
        {
            name: "meta.json",
            body: JSON.stringify(meta),
            type: "application/json"
        }
    ];
};
