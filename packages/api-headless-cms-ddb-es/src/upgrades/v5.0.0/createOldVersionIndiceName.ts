import { CmsContext } from "@webiny/api-headless-cms/types";

export const createOldVersionIndiceName = (context: CmsContext): string => {
    return `${context.security.getTenant().id}-headless-cms`;
};
