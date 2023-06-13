import { CmsGroupPlugin } from "@webiny/api-headless-cms";

export const createGroup = () => {
    return new CmsGroupPlugin({
        id: "testing",
        name: "Testing",
        icon: "fas/star",
        slug: "testing",
        description: ""
    });
};
