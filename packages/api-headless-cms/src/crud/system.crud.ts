import { NotAuthorizedError } from "@webiny/api-security";
import WebinyError from "@webiny/error";
import {
    OnSystemAfterInstallTopicParams,
    OnSystemBeforeInstallTopicParams,
    CmsContext,
    CmsSystem,
    CmsSystemContext,
    HeadlessCmsStorageOperations,
    OnSystemInstallErrorTopicParams
} from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { I18NLocale } from "@webiny/api-i18n/types";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

interface CreateSystemCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}
export const createSystemCrud = (params: CreateSystemCrudParams): CmsSystemContext => {
    const { getTenant, getLocale, storageOperations, context, getIdentity } = params;

    const onSystemBeforeInstall = createTopic<OnSystemBeforeInstallTopicParams>(
        "cms.onSystemBeforeInstall"
    );
    const onSystemAfterInstall = createTopic<OnSystemAfterInstallTopicParams>(
        "cms.onSystemAfterInstall"
    );

    const onSystemInstallError = createTopic<OnSystemInstallErrorTopicParams>(
        "cms.onSystemInstallError"
    );

    const getVersion = async () => {
        if (!getTenant()) {
            return null;
        }

        const system = await storageOperations.system.get({
            tenant: getTenant().id
        });

        return system?.version || null;
    };

    const setVersion = async (version: string) => {
        const original = await storageOperations.system.get({
            tenant: getTenant().id
        });
        const system: CmsSystem = {
            ...(original || {}),
            version,
            tenant: getTenant().id
        };
        if (!original) {
            await storageOperations.system.create({
                system
            });
            return;
        }
        await storageOperations.system.update({
            system
        });
    };

    return {
        /**
         * Lifecycle Events.
         */
        onSystemBeforeInstall,
        onSystemAfterInstall,
        onSystemInstallError,
        getSystemVersion: getVersion,
        setSystemVersion: setVersion,
        installSystem: async (): Promise<void> => {
            const identity = getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const version = await getVersion();
            if (version) {
                return;
            }
            try {
                /**
                 * First trigger before install event.
                 */
                await onSystemBeforeInstall.publish({
                    tenant: getTenant().id,
                    locale: getLocale().code
                });

                /**
                 * Add default content model group.
                 */
                try {
                    await context.cms.createGroup(initialContentModelGroup);
                } catch (ex) {
                    throw new WebinyError(
                        ex.message,
                        "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR",
                        {
                            group: initialContentModelGroup
                        }
                    );
                }

                const system: CmsSystem = {
                    version: context.WEBINY_VERSION,
                    tenant: getTenant().id
                };
                /**
                 * We need to create the system data.
                 */
                await storageOperations.system.create({
                    system
                });
                /**
                 * And trigger after install event.
                 */
                await onSystemAfterInstall.publish({
                    tenant: getTenant().id,
                    locale: getLocale().code
                });
            } catch (ex) {
                await onSystemInstallError.publish({
                    error: ex,
                    tenant: getTenant().id,
                    locale: getLocale().code
                });
                throw new WebinyError(ex.message, ex.code, ex.data);
            }
        }
    };
};
