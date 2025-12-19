import type { CreateWbPageData } from "~/context/pages/pages.types.js";

export const pageMocks: Record<string, CreateWbPageData> = {
    pageA: {
        properties: {
            title: "Page A",
            path: "/page-a"
        },
        metadata: {},
        bindings: {},
        elements: [],
        wbyAco_location: {
            folderId: "root"
        }
    },
    pageB: {
        properties: {
            title: "Page B",
            path: "/page-b"
        },
        metadata: {},
        bindings: {},
        elements: [],
        wbyAco_location: {
            folderId: "root"
        }
    },
    pageC: {
        properties: {
            title: "Page C",
            path: "/page-c"
        },
        metadata: {},
        bindings: {},
        elements: [],
        wbyAco_location: {
            folderId: "root"
        }
    }
};

export const userMock = {
    id: "12345678",
    displayName: "John Doe",
    type: "admin"
};
