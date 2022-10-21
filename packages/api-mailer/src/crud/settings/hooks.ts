import { MailerContext } from "~/types";
import {
    OnEntryAfterCreateTopicParams,
    OnEntryAfterUpdateTopicParams,
    OnEntryCreateErrorTopicParams,
    OnEntryUpdateErrorTopicParams
} from "@webiny/api-headless-cms/types";
import { SETTINGS_MODEL_ID } from "~/crud/settings/model";

const obfuscatePassword = (values: Record<string, any>) => {
    // eslint-disable-next-line
    const { password, ...rest } = values;

    return { rest };
};

type Params = (
    | OnEntryAfterCreateTopicParams
    | OnEntryCreateErrorTopicParams
    | OnEntryAfterUpdateTopicParams
    | OnEntryUpdateErrorTopicParams
) & {
    storageEntry?: any;
    original?: any;
};

const hook = async (params: Params) => {
    if (params.model.modelId !== SETTINGS_MODEL_ID) {
        return;
    }
    delete params.input["password"];
    params.entry.values = obfuscatePassword(params.entry.values);
    if (typeof params.original !== "undefined") {
        params.original.values = obfuscatePassword(params.original.values);
    }
    if (params.storageEntry) {
        params.storageEntry.values = obfuscatePassword(params.storageEntry.values);
    }
};
/**
 * We need to remove password from all error reporting and all returns.
 */
export const attachPasswordObfuscatingHooks = (context: MailerContext) => {
    context.cms.onEntryAfterCreate.subscribe(hook);
    context.cms.onEntryCreateError.subscribe(hook);
    context.cms.onEntryAfterUpdate.subscribe(hook);
    context.cms.onEntryUpdateError.subscribe(hook);
};
