import { Document } from "~/sdk/types";

export default {
    properties: {
        title: "Empty Page",
        path: "/page-1"
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
} as any as Document;
