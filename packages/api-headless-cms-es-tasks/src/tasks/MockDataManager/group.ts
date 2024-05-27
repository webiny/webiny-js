import { CmsGroupCreateInput } from "@webiny/api-headless-cms/types";

export const createGroupData = (): CmsGroupCreateInput => {
    return {
        id: "mocks",
        icon: "fas/star",
        name: "Mocks",
        description: "A group for mock models",
        slug: "mocks"
    };
};
