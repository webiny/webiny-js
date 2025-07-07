export const staticPage = {
    properties: {
        title: "Untitled",
        snippet: "",
        image: {
            id: "123",
            src: ""
        },
        path: "/page-1",
        tags: [],
        seo: {
            title: "",
            description: "",
            metaTags: []
        },
        social: {
            title: "", // og:title
            description: "", // og:description
            image: {
                // og:image
                id: "1",
                src: "...."
            },
            metaTags: [] // custom tags
        }
    },
    extensions: {},
    // This is internal data for editor-specific functionality.
    metadata: {
        // Static pages
        documentType: "page",
        pageType: "static",
        lastPreviewUrl: "",
        // Product pages
        // documentType: "page",
        // pageType: "kibo-product",
        // resourceType: "product",
        // resourceId: "123",
        // path: "/products/123"
    },
    bindings: {},
    state: {},
    elements: {
        root: {
            type: "Webiny/Element",
            id: "root",
            component: {
                name: "Webiny/Root"
            }
        }
    }
};
