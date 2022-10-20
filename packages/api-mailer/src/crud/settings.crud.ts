import WebinyError from "@webiny/error";
import {
    MailerContext,
    MailerContextObject,
    MailerSettingsContext,
    OnSettingsAfterCreateTopicParams,
    OnSettingsAfterGetTopicParams,
    OnSettingsAfterUpdateTopicParams,
    OnSettingsBeforeCreateTopicParams,
    OnSettingsBeforeGetTopicParams,
    OnSettingsBeforeUpdateTopicParams,
    OnSettingsCreateErrorTopicParams,
    OnSettingsGetErrorTopicParams,
    OnSettingsUpdateErrorTopicParams,
    TransportSettings
} from "~/types";
import { createTopic } from "@webiny/pubsub";
import { SETTINGS_MODEL_ID } from "./settings/model";
import { transformValuesFromEntry } from "~/crud/settings/transform";
import { getSecret } from "~/crud/settings/secret";
import { validation } from "~/crud/settings/validation";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";

/**
 * Note that settings cannot be used if there is no secret defined.
 */
export const createSettingsCrud = async (
    context: MailerContext
): Promise<MailerSettingsContext> => {
    let secret: string | null = null;
    try {
        secret = getSecret();
    } catch (ex) {
        console.log(`There is no password secret defined.`);
    }

    const getModel = async (): Promise<CmsModel> => {
        const model = await context.cms.getModel(SETTINGS_MODEL_ID);
        if (model) {
            return model;
        }
        throw new WebinyError(`Missing CMS Model "${SETTINGS_MODEL_ID}".`, "CMS_MODEL_MISSING", {
            modelId: SETTINGS_MODEL_ID
        });
    };

    const getTenant = () => {
        return context.tenancy.getCurrentTenant().id;
    };

    // get
    const onSettingsBeforeGet = createTopic<OnSettingsBeforeGetTopicParams>(
        "mailer.onSettingsBeforeGet"
    );
    const onSettingsAfterGet = createTopic<OnSettingsAfterGetTopicParams>(
        "mailer.onSettingsAfterGet"
    );
    const onSettingsGetError = createTopic<OnSettingsGetErrorTopicParams>(
        "mailer.onSettingsCreateError"
    );
    // create
    const onSettingsBeforeCreate = createTopic<OnSettingsBeforeCreateTopicParams>(
        "mailer.onSettingsBeforeCreate"
    );
    const onSettingsAfterCreate = createTopic<OnSettingsAfterCreateTopicParams>(
        "mailer.onSettingsAfterCreate"
    );
    const onSettingsCreateError = createTopic<OnSettingsCreateErrorTopicParams>(
        "mailer.onSettingsCreateError"
    );
    // update
    const onSettingsBeforeUpdate = createTopic<OnSettingsBeforeUpdateTopicParams>(
        "mailer.onSettingsBeforeUpdate"
    );
    const onSettingsAfterUpdate = createTopic<OnSettingsAfterUpdateTopicParams>(
        "mailer.onSettingsAfterUpdate"
    );
    const onSettingsUpdateError = createTopic<OnSettingsUpdateErrorTopicParams>(
        "mailer.onSettingsUpdateError"
    );

    return {
        onSettingsAfterGet,
        onSettingsBeforeGet,
        onSettingsGetError,
        onSettingsBeforeCreate,
        onSettingsAfterCreate,
        onSettingsCreateError,
        onSettingsBeforeUpdate,
        onSettingsAfterUpdate,
        onSettingsUpdateError,
        getSettings: async () => {
            const model = await getModel();

            const tenant = getTenant();
            try {
                await onSettingsBeforeGet.publish({
                    tenant
                });
                /**
                 * We always list because we have no id or something like that to query by.
                 * This should return one setting anyway.
                 */
                const [entries] = await context.cms.listLatestEntries(model, {
                    limit: 1,
                    sort: ["createdOn_DESC"]
                });
                const [entry] = entries;
                /**
                 * We know that entry is the transport settings entry, and it has required values.
                 */

                const settings = transformValuesFromEntry({
                    entry: entry as CmsEntry<TransportSettings>,
                    secret
                });

                await onSettingsAfterGet.publish({
                    tenant,
                    settings
                });

                return settings;
            } catch (ex) {
                await onSettingsGetError.publish({
                    tenant,
                    error: ex
                });
            }
            return null;
        },
        /**
         * Method should not be used outside of mailer
         * @internal
         */
        async createSettings(this: MailerContextObject, params) {
            const { input } = params;

            const model = await getModel();

            const result = validation.validate(input);

            const error = result.error;
            if (error) {
                throw new WebinyError("Validation failed!", "VALIDATION_ERROR", {
                    errors: error.details
                });
            }

            const settings: TransportSettings = {
                /**
                 * We can safely cast because input passed the validation.
                 */
                ...(input as TransportSettings)
            };

            try {
                await onSettingsBeforeCreate.publish({
                    input,
                    settings
                });

                await context.cms.createEntry(model, {
                    ...settings
                });

                await onSettingsAfterCreate.publish({
                    input,
                    settings
                });
                return settings;
            } catch (ex) {
                await onSettingsCreateError.publish({
                    settings,
                    input,
                    error: ex
                });
                throw new WebinyError(ex.message, ex.code, ex.data);
            }
        },
        /**
         * Method should not be used outside of mailer
         * @internal
         */
        async updateSettings(this: MailerContextObject, params) {
            const { input } = params;

            const model = await getModel();

            const result = validation.validate(input);

            const error = result.error;
            if (error) {
                throw new WebinyError("Validation failed!", "VALIDATION_ERROR", {
                    errors: error.details
                });
            }
            let original = params.original;
            if (!original) {
                original = await this.getSettings();
                if (!original) {
                    throw new WebinyError(
                        `You are trying to update settings, but there is no existing record. Create it first!`,
                        "NOT_FOUND"
                    );
                }
            }

            const settings: TransportSettings = {
                /**
                 * We can safely cast because input passed the validation.
                 */
                ...(input as TransportSettings)
            };

            try {
                await onSettingsBeforeUpdate.publish({
                    input,
                    settings,
                    original
                });

                await context.cms.updateEntry(model, original.id, {
                    ...settings
                });

                await onSettingsAfterUpdate.publish({
                    input,
                    settings,
                    original
                });
                return settings;
            } catch (ex) {
                await onSettingsUpdateError.publish({
                    original,
                    settings,
                    input,
                    error: ex
                });
                throw new WebinyError(ex.message, ex.code, ex.data);
            }
        },
        async saveSettings(this: MailerContextObject, params) {
            const { input } = params;

            const original = await this.getSettings();
            if (!original) {
                return this.createSettings({
                    input
                });
            }
            return this.updateSettings({
                input,
                original
            });
        }
    };
};
