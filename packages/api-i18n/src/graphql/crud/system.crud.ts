import {
    I18NContext,
    I18NSystem,
    I18NSystemStorageOperations,
    OnSystemAfterInstallTopicParams,
    OnSystemBeforeInstallTopicParams,
    SystemCRUD
} from "~/types";
import WebinyError from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import { createTopic } from "@webiny/pubsub";
import { Tenant } from "@webiny/api-tenancy/types";

interface CreateSystemCrudParams {
    context: I18NContext;
    storageOperations: I18NSystemStorageOperations;
    getTenant: () => Tenant;
}
export const createSystemCrud = (params: CreateSystemCrudParams): SystemCRUD => {
    const { context, storageOperations, getTenant } = params;

    const getTenantId = (): string => {
        return getTenant().id;
    };

    const onSystemBeforeInstall = createTopic<OnSystemBeforeInstallTopicParams>(
        "i18n.onSystemBeforeInstall"
    );
    const onSystemAfterInstall = createTopic<OnSystemAfterInstallTopicParams>(
        "i18n.onSystemAfterInstall"
    );

    return {
        onSystemBeforeInstall,
        onSystemAfterInstall,
        storageOperations,
        async getSystemVersion() {
            const system = await storageOperations.get();

            return system ? system.version : null;
        },
        async setSystemVersion(version) {
            const original = await storageOperations.get();

            const system: I18NSystem = {
                ...(original || {}),
                tenant: original?.tenant || getTenantId(),
                version
            };
            if (original) {
                try {
                    await storageOperations.update({
                        original,
                        system
                    });
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not update the system.",
                        ex.code || "SYSTEM_UPDATE_ERROR",
                        {
                            original,
                            system
                        }
                    );
                }
                return;
            }
            try {
                await storageOperations.create({
                    system
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create the system.",
                    ex.code || "SYSTEM_CREATE_ERROR",
                    {
                        version
                    }
                );
            }
        },
        async installSystem(this: SystemCRUD, { code }) {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }
            const { i18n } = context;
            const version = await this.getSystemVersion();
            if (version) {
                throw new WebinyError("I18N is already installed.", "INSTALL_ERROR", {
                    version
                });
            }
            await onSystemBeforeInstall.publish({
                code
            });

            await context.security.withoutAuthorization(async () => {
                return i18n.locales.createLocale({
                    code,
                    default: true
                });
            });

            await this.setSystemVersion(context.WEBINY_VERSION);
            await onSystemAfterInstall.publish({
                code
            });
        }
    };
};
