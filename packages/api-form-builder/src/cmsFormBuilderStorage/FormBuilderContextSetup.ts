import { createFormBuilder } from "~/index";
import { FormBuilderContext, FbFormPermission } from "~/types";
import WebinyError from "@webiny/error";
import { createFormBuilderPlugins } from "./createFormBuilderPlugins";
import { CmsModelPlugin } from "@webiny/api-headless-cms";
import { CmsFormBuilderStorage } from "./CmsFormBuilderStorage";
import { CmsSubmissionsStorage } from "./CmsSubmissionsStorage";
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

        const formsPermissions = new FormsPermissions({
            getIdentity: this.getIdentity.bind(this),
            getPermissions: () => this.context.security.getPermissions("fb.form"),
            fullAccessPermissionName: "fb.*"
        });

        return createFormBuilder({
            storageOperations,
            formsPermissions,
            getTenant: this.getTenantId.bind(this),
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

    private async setupCmsStorageOperations() {
        // This registers code plugins (model group, models)
        const { groupPlugin, formModelDefinition, submissionModelDefinition } =
            createFormBuilderPlugins();

        // Finally, register all plugins
        this.context.plugins.register([
            groupPlugin,
            new CmsModelPlugin(formModelDefinition),
            new CmsModelPlugin(submissionModelDefinition)
        ]);
        const formModel = await this.getModel("fbForm");
        const submissionModel = await this.getModel("fbSubmission");

        return {
            ...(await CmsFormBuilderStorage.create({
                model: formModel,
                cms: this.context.cms,
                security: this.context.security
            })),
            ...(await CmsSubmissionsStorage.create({
                model: submissionModel,
                cms: this.context.cms,
                security: this.context.security
            }))
        };
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
