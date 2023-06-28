import WebinyError from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import {
    OnSystemBeforeInstallTopic,
    OnSystemAfterInstallTopic,
    FormBuilder,
    FormBuilderContext,
    Settings,
    System,
    SystemCRUD
} from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { createTopic } from "@webiny/pubsub";
import { SecurityIdentity } from "@webiny/api-security/types";
import { I18NLocale } from "@webiny/api-i18n/types";

interface CreateSystemCrudParams {
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    context: FormBuilderContext;
}

export const createSystemCrud = (params: CreateSystemCrudParams): SystemCRUD => {
    const { getTenant, getLocale, context } = params;

    const onSystemBeforeInstall = createTopic<OnSystemBeforeInstallTopic>(
        "formBuilder.onSystemBeforeInstall"
    );
    const onSystemAfterInstall = createTopic<OnSystemAfterInstallTopic>(
        "formBuilder.onSystemAfterInstall"
    );

    return {
        /**
         * Released in 5.34.0
         */
        onSystemBeforeInstall,
        onSystemAfterInstall,
        async getSystem(this: FormBuilder) {
            try {
                return await this.storageOperations.getSystem({
                    tenant: getTenant().id
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load system.",
                    ex.code || "GET_SYSTEM_ERROR"
                );
            }
        },
        async getSystemVersion(this: FormBuilder) {
            const system = await this.getSystem();
            return system ? system.version || null : null;
        },
        async setSystemVersion(this: FormBuilder, version: string) {
            const original = await this.getSystem();
            const system: System = {
                version,
                tenant: getTenant().id
            };
            if (!original) {
                try {
                    await this.storageOperations.createSystem({
                        system
                    });
                    return;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not create system.",
                        ex.code || "CREATE_SYSTEM_ERROR",
                        {
                            system
                        }
                    );
                }
            }

            try {
                await this.storageOperations.updateSystem({
                    original,
                    system
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update system.",
                    ex.code || "UPDATE_SYSTEM_ERROR",
                    {
                        system,
                        original
                    }
                );
            }
        },
        async installSystem(this: FormBuilder, { domain }) {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }
            const version = await this.getSystemVersion();
            if (version) {
                throw new WebinyError(
                    "Form builder is already installed.",
                    "FORM_BUILDER_INSTALL_ABORTED"
                );
            }

            /**
             * Prepare "settings" data
             */
            const data: Partial<Settings> = {};

            if (domain) {
                data.domain = domain;
            }

            try {
                await onSystemBeforeInstall.publish({
                    tenant: getTenant().id,
                    locale: getLocale().code
                });

                await this.createSettings(data);

                await onSystemAfterInstall.publish({
                    tenant: getTenant().id,
                    locale: getLocale().code
                });
                await this.setSystemVersion(context.WEBINY_VERSION);
            } catch (err) {
                await this.deleteSettings();

                throw new WebinyError(
                    "Form builder failed to install!",
                    "FORM_BUILDER_INSTALL_ABORTED",
                    {
                        reason: err.message
                    }
                );
            }

            /**
             * Form Builder is the last app that has an installer. Once its installation is finished,
             * we need to notify the system that tenant is now ready to use, because many external plugins
             * insert initial tenant data into various apps, copy data from other tenants, etc.
             */
            await context.tenancy.onTenantAfterInstall.publish({});
        }
    };
};
