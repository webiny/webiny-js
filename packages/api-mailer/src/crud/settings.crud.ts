import WebinyError from "@webiny/error";
import {
    ExtendedTransportSettings,
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
import { transformInputToEntryValues, transformValuesFromEntry } from "~/crud/settings/transform";
import { getSecret } from "~/crud/settings/secret";
import { createValidation, updateValidation } from "~/crud/settings/validation";
import { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { attachPasswordObfuscatingHooks } from "~/crud/settings/hooks";
import { NotAuthorizedError } from "@webiny/api-security";

const defaultPort = 25;
/**
 * Note that settings cannot be used if there is no secret defined.
 */
export const createSettingsCrud = async (
    context: MailerContext
): Promise<MailerSettingsContext> => {
    /**
     * We need to remove password from all references on create and update in the CMS.
     */
    attachPasswordObfuscatingHooks(context);

    const getTenant = () => {
        return context.tenancy.getCurrentTenant().id;
    };

    const validateAccess = async () => {
        const permission = await context.security.getPermission("mailer.settings");

        if (permission) {
            return;
        }
        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to update the mailer settings.`
            }
        });
    };

    let secret: string | null = null;
    try {
        secret = getSecret();
    } catch {}

    const getModel = async (): Promise<CmsModel> => {
        return context.security.withoutAuthorization(async () => {
            try {
                const model = await context.cms.getModel(SETTINGS_MODEL_ID);
                if (model) {
                    return model;
                }
            } catch (ex) {
                throw new WebinyError(ex.message, ex.code, ex.data);
            }
            throw new WebinyError(
                `Missing CMS Model "${SETTINGS_MODEL_ID}".`,
                "CMS_MODEL_MISSING",
                {
                    modelId: SETTINGS_MODEL_ID
                }
            );
        });
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

    const checkSecret = (): void => {
        if (secret) {
            return;
        }
        throw new WebinyError("There must be a password secret defined!", "PASSWORD_SECRET_ERROR", {
            description:
                "To store the Mailer settings, you must have a password secret environment variable defined."
        });
    };

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
            checkSecret();

            const model = await getModel();

            const tenant = getTenant();
            return await context.security.withoutAuthorization(async () => {
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
                    if (!entry) {
                        return null;
                    }
                    const settings = transformValuesFromEntry({
                        entry: entry as CmsEntry<TransportSettings>,
                        secret
                    });

                    const passwordlessSettings: TransportSettings = {
                        ...settings,
                        password: ""
                    };

                    await onSettingsAfterGet.publish({
                        tenant,
                        settings: passwordlessSettings
                    });

                    return settings;
                } catch (ex) {
                    await onSettingsGetError.publish({
                        tenant,
                        error: ex
                    });
                }
                return null;
            });
        },
        /**
         * Method should not be used outside of mailer
         * @internal
         */
        async createSettings(this: MailerContextObject, params) {
            checkSecret();
            await validateAccess();

            const { input } = params;

            const model = await getModel();

            const result = createValidation.safeParse(input);

            if (!result.success) {
                throw new WebinyError("Validation failed!", "VALIDATION_ERROR", {
                    errors: result.error.errors
                });
            }

            const { password, ...settings } = result.data;

            const passwordlessSettings: TransportSettings = {
                ...settings,
                port: settings.port || defaultPort,
                password: ""
            };

            return await context.security.withoutAuthorization(async () => {
                try {
                    await onSettingsBeforeCreate.publish({
                        settings: passwordlessSettings
                    });

                    await context.cms.createEntry(
                        model,
                        transformInputToEntryValues({
                            values: {
                                ...passwordlessSettings,
                                password
                            },
                            secret
                        })
                    );

                    await onSettingsAfterCreate.publish({
                        settings: passwordlessSettings
                    });
                    return passwordlessSettings;
                } catch (ex) {
                    await onSettingsCreateError.publish({
                        settings: passwordlessSettings,
                        error: ex
                    });
                    throw new WebinyError(ex.message, ex.code, ex.data);
                }
            });
        },
        /**
         * Method should not be used outside of mailer
         * @internal
         */
        async updateSettings(this: MailerContextObject, params) {
            checkSecret();
            await validateAccess();

            const { input, original: initialOriginal } = params;

            const model = await getModel();

            const result = updateValidation.safeParse(input);

            if (!result.success) {
                throw new WebinyError("Validation failed!", "VALIDATION_ERROR", {
                    errors: result.error.errors
                });
            }

            let dbOriginal: ExtendedTransportSettings | null = null;
            if (!initialOriginal) {
                dbOriginal = await this.getSettings();
            }
            const original = initialOriginal || dbOriginal;
            if (!original) {
                throw new WebinyError(
                    `You are trying to update settings, but there is no existing record. Create it first!`,
                    "NOT_FOUND"
                );
            }

            const { password, ...settings } = result.data;

            const passwordlessSettings: TransportSettings = {
                ...settings,
                port: settings.port || original.port || defaultPort,
                password: ""
            };
            return await context.security.withoutAuthorization(async () => {
                try {
                    await onSettingsBeforeUpdate.publish({
                        settings: passwordlessSettings,
                        original: original
                    });

                    const transformedInput = transformInputToEntryValues({
                        values: {
                            ...passwordlessSettings,
                            password: password || original.password
                        },
                        secret
                    });
                    /**
                     * We want to make sure that old password gets stored again in case no password was sent in update input.
                     */
                    await context.cms.updateEntry(model, original.id, transformedInput);

                    await onSettingsAfterUpdate.publish({
                        settings: passwordlessSettings,
                        original
                    });
                    return passwordlessSettings;
                } catch (ex) {
                    await onSettingsUpdateError.publish({
                        original,
                        settings: passwordlessSettings,
                        error: ex
                    });
                    throw new WebinyError(ex.message, ex.code, ex.data);
                }
            });
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
