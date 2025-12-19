import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";

export const pageMocks: Record<string, CreatePageUseCase.Params> = {
    pageA: {
        properties: {
            title: "Page A",
            path: "/page-a"
        },
        metadata: {},
        bindings: {},
        elements: [],
        location: {
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
        location: {
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
        location: {
            folderId: "root"
        }
    }
};

export const userMock = {
    id: "12345678",
    displayName: "John Doe",
    type: "admin"
};
