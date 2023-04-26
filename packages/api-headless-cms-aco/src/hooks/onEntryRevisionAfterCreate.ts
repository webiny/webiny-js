import WebinyError from "@webiny/error";
import { isAcoModel } from "~/utils/isAcoModel";
import { updateHeadlessCmsRecordPayload } from "~/utils/updateHeadlessCmsRecordPayload";
import { CmsEntryRecordData, CmsAcoContext } from "~/types";

export const attachOnEntryRevisionAfterCreate = (
    context: Pick<CmsAcoContext, "cms" | "plugins" | "aco">
): void => {
    context.cms.onEntryRevisionAfterCreate.subscribe(async ({ entry, model }) => {
        if (isAcoModel(model)) {
            return;
        }
        try {
            const payload = await updateHeadlessCmsRecordPayload({
                context,
                model,
                entry
            });
            await context.aco.search.update<CmsEntryRecordData>(entry.entryId, payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: `Error while executing ACO "onEntryAfterUpdate".`,
                code: "ACO_ENTRY_AFTER_UPDATE_HOOK"
            });
        }
    });
};
