import { CmsContext } from "../../../types";

export const createOldVersionIndiceName = (context: CmsContext): string => {
    return `${context.security.getTenant().id}-headless-cms`;
};
