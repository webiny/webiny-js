import { Page, Revision, Category } from "webiny-api-cms";

export default [
    async () => {
        return {
            entity: Category,
            data: [
                {
                    title: "Static",
                    slug: "static",
                    url: "/"
                }
            ]
        };
    }
];
