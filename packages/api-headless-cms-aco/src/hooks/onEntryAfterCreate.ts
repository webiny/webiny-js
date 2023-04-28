import WebinyError from "@webiny/error";
import { isAcoModel } from "~/utils/isAcoModel";
import { createHeadlessCmsRecordPayload } from "~/utils/createHeadlessCmsRecordPayload";
import { CmsAcoContext, CmsEntryRecordData } from "~/types";
import { CMS_ENTRY_FOLDER_GRAPHQL_SCHEMA_FIELD } from "~/contants";

export const attachOnEntryAfterCreate = (
    context: Pick<CmsAcoContext, "cms" | "plugins" | "aco">
): void => {
    context.cms.onEntryAfterCreate.subscribe(async ({ entry, model, rawInput }) => {
        if (isAcoModel(model)) {
            return;
        }
        try {
            const payload = await createHeadlessCmsRecordPayload({
                context,
                model,
                entry,
                /**
                 * We have a custom input field which we use to store the folder ID.
                 * That field is not passed into the entry values.
                 */
                folderId: rawInput[CMS_ENTRY_FOLDER_GRAPHQL_SCHEMA_FIELD]
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
