import { z } from "zod";

export const translatePageParams = z.object({
    pageId: z.string(),
    folderId: z.string(),
    currentLanguage: z.string()
});
