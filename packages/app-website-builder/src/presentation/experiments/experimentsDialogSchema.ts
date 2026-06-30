import { z } from "zod";

export const experimentsDialogParams = z.object({
    pageId: z.string(),
    pageEntryId: z.string(),
    baselineRevisionId: z.string(),
    pageIsPublished: z.boolean()
});
