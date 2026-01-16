import type { CmsEntry } from "~/types";

export const createMockCmsEntry = <T extends CmsEntry = CmsEntry>(input: Partial<T>): T => {
    return {
        ...input,
        wbyAco_location: {
            folderId: "root"
        }
    } as T;
};
