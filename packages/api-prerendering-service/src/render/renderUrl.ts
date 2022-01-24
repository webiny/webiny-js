import chromium from "chrome-aws-lambda";
import posthtml from "posthtml";
import { noopener } from "posthtml-noopener";
/**
 * Package posthtml-plugin-link-preload has no types.
 */
// @ts-ignore
import posthtmlPluginLinkPreload from "posthtml-plugin-link-preload";
import injectApolloState from "./injectApolloState";
import injectRenderId from "./injectRenderId";
import injectRenderTs from "./injectRenderTs";
import injectTenantLocale from "./injectTenantLocale";
import injectNotFoundPageFlag from "./injectNotFoundPageFlag";
import getPsTags from "./getPsTags";
import shortid from "shortid";
import { HandlerContext } from "./types";
import { Browser, Page } from "puppeteer";
import { Args as BaseHandlerArgs, Configuration } from "~/types";

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
    meta: Record<string, any>;
}

export default async (url: string, args: Params): Promise<[File[], Meta]> => {
    const id = shortid.generate();
    const ts = new Date().getTime();

    console.log(`Rendering "${url}" (render ID: ${id})...`);

    const renderUrl =
        typeof args.renderUrlFunction === "function"
            ? args.renderUrlFunction
            : defaultRenderUrlFunction;
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

    const allArgs = { render, args, url, id, ts };
    const { html } = await posthtml([
        noopener(),
        posthtmlPluginLinkPreload(),
        // @ts-ignore
        injectRenderId(allArgs),
        // @ts-ignore
        injectRenderTs(allArgs),
        // @ts-ignore
        injectApolloState(allArgs),
        // @ts-ignore
        injectTenantLocale(allArgs),
        // @ts-ignore
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

export interface RenderResult {
    content: string;
    meta: Record<string, any>;
}

export interface Params {
    context: HandlerContext;
    args: BaseHandlerArgs;
    configuration: Configuration;
    renderUrlFunction?: (url: string) => RenderResult;
}

export interface Meta {
    url: string;
    id: string;
    ts: number;
    render: RenderResult;
    args: Params;
}

interface GraphQLCache {
    query: any;
    variables: Record<string, any>;
    data: Record<string, any>;
}

export const defaultRenderUrlFunction = async (
    url: string,
    params: Params
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

    const notFoundPage = params?.args?.configuration?.meta?.notFoundPage;
    if (notFoundPage) {
        console.log("Setting locale (__PS_NOT_FOUND_PAGE__) to window object....");
        windowSet(browserPage, "__PS_NOT_FOUND_PAGE__", true);
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
            const responses: Record<string, any> = await response.json();
            const postData = JSON.parse(request.postData());
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
