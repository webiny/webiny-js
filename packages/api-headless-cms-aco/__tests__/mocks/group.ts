import { createCmsGroup } from "@webiny/api-headless-cms";

export const createGroup = () => {
    return createCmsGroup({
        id: "group",
        name: "Group",
        icon: "fas/star",
        description: "",
        slug: "group"
    });
};
