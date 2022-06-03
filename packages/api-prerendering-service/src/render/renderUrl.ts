import chromium from "chrome-aws-lambda";
import posthtml from "posthtml";
import { noopener } from "posthtml-noopener";
/**
 * Package posthtml-plugin-link-preload has no types.
 */
// @ts-ignore
import posthtmlPluginLinkPreload from "posthtml-plugin-link-preload";
import absoluteAssetUrls from "./absoluteAssetUrls";
import injectApolloState from "./injectApolloState";
import injectRenderId from "./injectRenderId";
import injectRenderTs from "./injectRenderTs";
import injectTenantLocale from "./injectTenantLocale";
import injectNotFoundPageFlag from "./injectNotFoundPageFlag";
import getPsTags from "./getPsTags";
import shortid from "shortid";
import {
    RenderResult,
    RenderUrlCallableParams,
    RenderUrlParams,
    RenderUrlPostHtmlParams
} from "./types";
import { Browser, Page } from "puppeteer";
import { TagUrlLink } from "~/types";

const windowSet = (page: Page, name: string, value: string | boolean) => {
    page.evaluateOnNewDocument(`
    Object.defineProperty(window, '${name}', {
      get() {
        return '${value}'
      }
    })`);
};

interface Meta {
    url: string;
    id: string;
    ts: number;
    render: RenderResult;
    args: RenderUrlParams;
}

export interface File {
    type: string;
    body: any;
    name: string;
    meta: {
        tags?: TagUrlLink[];
        [key: string]: any;
    };
}

export default async (url: string, args: RenderUrlParams): Promise<[File[], Meta]> => {
    const id = shortid.generate();
    const ts = new Date().getTime();

    console.log(`Rendering "${url}" (render ID: ${id})...`);

    let renderUrl = defaultRenderUrlFunction;
    if (typeof args.renderUrlFunction === "function") {
        renderUrl = args.renderUrlFunction;
    }
    const render = await renderUrl(url, args);

    // Process HTML.
    // TODO: should be plugins (will also eliminate lower @ts-ignore instructions).
    console.log("Processing HTML...");

    // TODO: regular text processing plugins...

    {
        const regex = /<script (src="\/static\/js\/)/gm;
        const subst = `<script data-link-preload data-link-preload-type="markup" src="/static/js/`;
        render.content = render.content.replace(regex, subst);
    }

    {
        const regex = /<link href="\/static\/css\//gm;
        const subst = `<link data-link-preload data-link-preload-type="markup" href="/static/css/`;
        render.content = render.content.replace(regex, subst);
    }

    const allArgs: RenderUrlPostHtmlParams = { render, args, url, id, ts };
    const { html } = await posthtml([
        noopener(),
        absoluteAssetUrls(),
        posthtmlPluginLinkPreload(),
        injectRenderId(allArgs),
        injectRenderTs(allArgs),
        injectApolloState(allArgs),
        injectTenantLocale(allArgs),
        injectNotFoundPageFlag(allArgs)
    ]).process(render.content);

    console.log("Processing HTML done.");

    console.log(`Rendering "${url}" completed.`);

    // TODO: should be plugins.
    return [
        [
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
                body: JSON.stringify(render.meta.gqlCache),
                type: "application/json",
                meta: {}
            }
        ],
        allArgs
    ];
};

let browser: Browser;

interface GraphQLCache {
    query: any;
    variables: Record<string, any>;
    data: Record<string, any>;
}

export const defaultRenderUrlFunction = async (
    url: string,
    params: RenderUrlCallableParams
): Promise<RenderResult> => {
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

    // Can be used to add additional logic - e.g. skip a GraphQL query to be made when in pre-rendering process.
    windowSet(browserPage, "__PS_RENDER__", true);

    const tenant = params?.args?.configuration?.meta?.tenant;
    if (tenant) {
        console.log("Setting tenant (__PS_RENDER_TENANT__) to window object....");
        windowSet(browserPage, "__PS_RENDER_TENANT__", tenant);
    }

    const locale = params?.args?.configuration?.meta?.locale;
    if (locale) {
        console.log("Setting locale (__PS_RENDER_LOCALE__) to window object....");
        windowSet(browserPage, "__PS_RENDER_LOCALE__", locale);
    }

    // Don't load these resources during prerender.
    const skipResources = ["image", "stylesheet"];
    await browserPage.setRequestInterception(true);

    const gqlCache: GraphQLCache[] = [];

    browserPage.on("request", request => {
        if (skipResources.includes(request.resourceType())) {
            request.abort();
        } else {
            request.continue();
        }
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
                const { operationName, query, variables } = operations[i];

                // TODO: Should be handled via a plugin.
                const operationsAllowedToCached = ["PbGetPublishedPage"];
                if (operationsAllowedToCached.includes(operationName)) {
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

    const apolloState = await browserPage.evaluate(() => {
        // @ts-ignore
        return window.getApolloState();
    });

    return {
        content: await browserPage.content(),
        // TODO: ideally, meta should be assigned here in a more "plugins style" way, not hardcoded.
        meta: {
            gqlCache,
            apolloState
        }
    };
};
