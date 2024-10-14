import { CmsGroup } from "~tests/types";

export const createContentModelGroup = (): CmsGroup => {
    return {
        id: "5e7c96c46adcbe0007268295",
        name: "A sample content model group",
        slug: "a-sample-content-model-group",
        description: "This is a simple content model group example.",
        icon: {
            type: "emoji",
            name: "thumbs_up",
            value: "👍"
        }
    };
};
