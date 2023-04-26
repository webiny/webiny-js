import WebinyError from "@webiny/error";
import { isAcoModel } from "~/utils/isAcoModel";
import { createHeadlessCmsRecordPayload } from "~/utils/createHeadlessCmsRecordPayload";
import { CmsEntryRecordData, CmsAcoContext } from "~/types";

export const attachOnEntryAfterCreate = (
    context: Pick<CmsAcoContext, "cms" | "plugins" | "aco">
): void => {
    context.cms.onEntryAfterCreate.subscribe(async ({ entry, model }) => {
        if (isAcoModel(model)) {
            return;
        }
        try {
            const payload = await createHeadlessCmsRecordPayload({
                context,
                model,
                entry
            });
            await context.aco.search.create<CmsEntryRecordData>(payload);
        } catch (error) {
            throw WebinyError.from(error, {
                message: `Error while executing ACO "onEntryAfterCreate".`,
                code: "ACO_ENTRY_AFTER_CREATE_HOOK"
            });
        }
    });
};
