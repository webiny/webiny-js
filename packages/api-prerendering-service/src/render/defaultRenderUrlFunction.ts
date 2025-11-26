import chromium from "@sparticuz/chromium";
import puppeteer, { Browser, Page } from "puppeteer-core";
import extractPeLoaderDataFromHtml from "./extractPeLoaderDataFromHtml";
import { RenderResult, RenderUrlCallableParams } from "./types";
import { TagPathLink } from "~/types";

const windowSet = (page: Page, name: string, value: string | boolean) => {
    page.evaluateOnNewDocument(`
    Object.defineProperty(window, '${name}', {
      get() {
        return '${value}'
      }
    })`);
};

export interface File {
    type: string;
    body: any;
    name: string;
    meta: {
        tags?: TagPathLink[];
        [key: string]: any;
    };
}

export const defaultRenderUrlFunction = async (
    url: string,
    params: RenderUrlCallableParams
): Promise<RenderResult> => {
    let browser!: Browser;

    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: null,
            executablePath: await chromium.executablePath(),
            headless: true,
            acceptInsecureCerts: true
        });

        const browserPage = await browser.newPage();

        // Can be used to add additional logic - e.g. skip a GraphQL query to be made when in pre-rendering process.
        windowSet(browserPage, "__PS_RENDER__", true);

        const tenant = params.args.tenant;
        if (tenant) {
            console.log("Setting tenant (__PS_RENDER_TENANT__) to window object....");
            windowSet(browserPage, "__PS_RENDER_TENANT__", tenant);
        }

        const locale = params.args.locale;
        if (locale) {
            console.log("Setting locale (__PS_RENDER_LOCALE__) to window object....");
            windowSet(browserPage, "__PS_RENDER_LOCALE__", locale);
        }

        const renderResult: RenderResult = {
            content: "",
            meta: {
                interceptedRequests: [],
                apolloState: {},
                cachedData: {
                    apolloGraphQl: [],
                    peLoaders: []
                }
            }
        };

        // Don't load these resources during prerender.
        const skipResources = ["image"];
        await browserPage.setRequestInterception(true);

        browserPage.on("request", request => {
            const issuedRequest = {
                type: request.resourceType(),
                url: request.url(),
                aborted: false
            };

            if (skipResources.includes(issuedRequest.type)) {
                issuedRequest.aborted = true;
                request.abort();
            } else {
                request.continue();
            }

            renderResult.meta.interceptedRequests.push(issuedRequest);
        });

        // TODO: should be a plugin.
        browserPage.on("response", async response => {
            const request = response.request();
            const url = request.url();
            if (url.includes("/graphql") && request.method() === "POST") {
                const responses = (await response.json()) as Record<string, any>;
                const postData = JSON.parse(request.postData() as string);
                const operations = Array.isArray(postData) ? postData : [postData];

                for (let i = 0; i < operations.length; i++) {
                    const { query, variables } = operations[i];

                    // For now, we're doing a basic @ps(cache: true) match to determine if the
                    // cache was set true. In the future, if we start introducing additional
                    // parameters here, we should probably make this parsing smarter.
                    const mustCache = query.match(/@ps\((cache: true)\)/);

                    if (mustCache) {
                        const data = Array.isArray(responses) ? responses[i].data : responses.data;
                        renderResult.meta.cachedData.apolloGraphQl.push({
                            query,
                            variables,
                            data
                        });
                    }
                }
                return;
            }
        });

        // Load URL and wait for all network requests to settle.
        await browserPage.goto(url, { waitUntil: "networkidle0" });

        renderResult.content = await browserPage.content();

        renderResult.meta.apolloState = await browserPage.evaluate(() => {
            // @ts-expect-error
            return window.getApolloState();
        });

        renderResult.meta.cachedData.peLoaders = extractPeLoaderDataFromHtml(renderResult.content);

        return renderResult;
    } finally {
        if (browser) {
            // We need to close all open pages first, to prevent browser from hanging when closed.
            const pages = await browser.pages();
            for (const page of pages) {
                await page.close();
            }

            // This is fixing an issue where the `await browser.close()` would hang indefinitely.
            // The "inspiration" for this fix came from the following issue:
            // https://github.com/Sparticuz/chromium/issues/85
            console.log("Killing browser process...");
            const childProcess = browser.process();
            if (childProcess) {
                childProcess.kill(9);
            }

            console.log("Browser process killed.");
        }
    }

    // There's no catch block here because errors are already being handled
    // in the entrypoint function, located in `./index.ts` file.
};
