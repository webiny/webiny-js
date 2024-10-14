import { CmsGroupPlugin } from "@webiny/api-headless-cms";

export const createGroup = () => {
    return new CmsGroupPlugin({
        id: "testing",
        name: "Testing",
        icon: {
            type: "emoji",
            name: "thumbs_up",
            value: "👍"
        },
        slug: "testing",
        description: ""
    });
};
