import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { CreatePageUseCase } from "@webiny/api-website-builder/features/pages/CreatePage/index.js";
import { expectOk } from "./pages.js";

/**
 * The `properties` of the page `createRichPage` creates: every key the editor must keep when it
 * writes `title` and the SEO scalars (`path` and `language` stay, `social`, `image`, `tags`,
 * `snippet` and `seo.metaTags` are read-only). `path` is made unique per page.
 */
export const RICH_PROPERTIES = {
    title: "Home",
    language: "en",
    snippet: "Welcome to Acme.",
    tags: ["news", "launch"],
    image: { id: "img-1", name: "hero.png", src: "https://files.example.com/hero.png" },
    seo: {
        title: "Home | Acme",
        description: "The home page.",
        metaTags: [{ name: "robots", content: "all" }],
        canonicalUrl: "/home",
        noIndex: false,
        noFollow: false,
        structuredSchema: "{}"
    },
    social: {
        title: "Acme on social",
        description: "Share me.",
        metaTags: [{ property: "og:type", content: "website" }]
    }
};

let pathCounter = 0;

/** Creates a draft page with a full `properties` blob, three elements and bindings, as the context's identity. */
export const createRichPage = async (
    context: CmsContext,
    overrides: Record<string, unknown> = {}
): Promise<WbPage> => {
    pathCounter++;
    return expectOk(
        await context.container.resolve(CreatePageUseCase).execute({
            properties: {
                ...RICH_PROPERTIES,
                path: `/rich-page-${pathCounter}`,
                ...overrides
            },
            metadata: { notes: "Draft." },
            bindings: { text1: { inputs: { text: { static: "Hello" } } } },
            elements: {
                root: { type: "Webiny/Element", id: "root", component: { name: "Webiny/Box" } },
                text1: {
                    type: "Webiny/Element",
                    id: "text1",
                    component: { name: "Webiny/Text" },
                    parent: { id: "root", slot: "children" }
                },
                text2: {
                    type: "Webiny/Element",
                    id: "text2",
                    component: { name: "Webiny/Text" },
                    parent: { id: "root", slot: "children" }
                }
            },
            location: { folderId: "root" }
        })
    );
};
