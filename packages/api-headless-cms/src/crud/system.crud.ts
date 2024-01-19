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
    icon: {
        type: "icon",
        name: "regular_star",
        value: '<path fill="currentColor" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3l153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4L459.8 484c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6l68.6-141.3C270.4 5.2 278.7 0 287.9 0zm0 79l-52.5 108.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9l85.9 85.1c5.5 5.5 8.1 13.3 6.8 21l-20.3 119.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2l-20.2-119.6c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1l-118.3-17.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/>',
        width: 576
    }
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
