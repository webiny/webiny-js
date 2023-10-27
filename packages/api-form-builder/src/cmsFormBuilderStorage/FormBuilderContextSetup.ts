import { createFormBuilder } from "~/index";
import { FormBuilderContext, FbFormPermission } from "~/types";
import WebinyError from "@webiny/error";
import { SecurityPermission } from "@webiny/api-security/types";
import { createFormBuilderPlugins } from "./createFormBuilderPlugins";
import { CmsModelPlugin } from "@webiny/api-headless-cms";
import { CmsFormBuilderStorage } from "./CmsFormBuilderStorage";
import { AppPermissions } from "@webiny/api-security/utils/AppPermissions";

class FormsPermissions extends AppPermissions<FbFormPermission> {}

export class FormBuilderContextSetup {
    private readonly context: FormBuilderContext;

    constructor(context: FormBuilderContext) {
        this.context = context;
    }

    async setupContext(storageOperations: any) {
        const formStorageOps = await this.context.security.withoutAuthorization(() => {
            return this.setupCmsStorageOperations();
        });

        if (formStorageOps) {
            storageOperations = {
                ...storageOperations,
                ...formStorageOps
            };
        }

        const formPermissions = new FormsPermissions({
            getIdentity: this.context.security.getIdentity,
            getPermissions: () => this.context.security.getPermissions("fb.form"),
            fullAccessPermissionName: "fb.*"
        });

        return createFormBuilder({
            storageOperations,
            formsPermissions: this.formsPermissions,
            getTenant: () => this.context.tenancy.getCurrentTenant(),
            getLocale: this.getLocale.bind(this),
            context: this.context
        });
    }

    private getLocale() {
        const locale = this.context.i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing locale on context.i18n locale in File Manager API.",
                "LOCALE_ERROR"
            );
        }
        return locale;
    }

    private getIdentity() {
        return this.context.security.getIdentity();
    }

    private getTenantId() {
        return this.context.tenancy.getCurrentTenant().id;
    }

    private async getPermissions<T extends SecurityPermission = SecurityPermission>(
        name: string
    ): Promise<T[]> {
        return this.context.security.getPermissions(name);
    }

    private basePermissionsArgs = {
        getIdentity: this.getIdentity.bind(this),
        fullAccessPermissionName: "fb.*"
    };

    private formsPermissions = new FormsPermissions({
        ...this.basePermissionsArgs,
        getPermissions: () => this.context.security.getPermissions("fb.form")
    });

    private async setupCmsStorageOperations() {
        // This registers code plugins (model group, models)
        const { groupPlugin, formModelDefinition } = createFormBuilderPlugins();

        // Finally, register all plugins
        this.context.plugins.register([groupPlugin, new CmsModelPlugin(formModelDefinition)]);
        const formModel = await this.getModel("fbForm");

        return await CmsFormBuilderStorage.create({
            formModel,
            cms: this.context.cms,
            security: this.context.security
        });
    }

    private async getModel(modelId: string) {
        const model = await this.context.cms.getModel(modelId);
        if (!model) {
            throw new WebinyError({
                code: "MODEL_NOT_FOUND",
                message: `Content model "${modelId}" was not found!`
            });
        }

        return model;
    }
}
