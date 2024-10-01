import { CmsEntry } from "~/types";

export const createMockCmsEntry = <T extends CmsEntry = CmsEntry>(input: Partial<T>): T => {
    return {
        ...input
    } as T;
};
