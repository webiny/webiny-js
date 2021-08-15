import { CmsContext } from "@webiny/api-headless-cms/types";

export const createOldVersionIndiceName = (context: CmsContext): string => {
    return `${context.tenancy.getCurrentTenant().id}-headless-cms`;
};
