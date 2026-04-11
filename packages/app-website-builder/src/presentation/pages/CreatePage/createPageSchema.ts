import { z } from "zod";

export const createPageDialogParams = z.object({
    folderId: z.string()
});
