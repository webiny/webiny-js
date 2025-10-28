import type { FileManagerAliasesStorageOperations, FilePermission } from "~/types.js";
import { type FileManagerContext, type SettingsPermission } from "~/types.js";
import type { FileManagerConfig } from "~/createFileManager/types.js";
import { createFileManager } from "~/createFileManager/index.js";
import { FileStorage } from "~/storage/FileStorage.js";
import WebinyError from "@webiny/error";
import { createFileModel, FILE_MODEL_ID } from "~/cmsFileStorage/file.model.js";
import { CmsFilesStorage } from "~/cmsFileStorage/CmsFilesStorage.js";
import { CmsModelModifierPlugin } from "~/modelModifier/CmsModelModifier.js";
import { CmsModelPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { FilesPermissions } from "~/createFileManager/permissions/FilesPermissions.js";
import { SettingsPermissions } from "~/createFileManager/permissions/SettingsPermissions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { getLocale } from "@webiny/api-core/legacy/i18n/getLocale.js";

export class FileManagerContextSetup {
    private readonly context: FileManagerContext;

    constructor(context: FileManagerContext) {
        this.context = context;
    }

    async setupContext(storageOperations: FileManagerConfig["storageOperations"]) {
        if (storageOperations.beforeInit) {
            await storageOperations.beforeInit(this.context);
        }

        const fileStorageOps = await this.context.security.withoutAuthorization(() => {
            return this.setupCmsStorageOperations(storageOperations.aliases);
        });

        if (fileStorageOps) {
            storageOperations.files = fileStorageOps;
        }

        const filesPermissions = new FilesPermissions({
            getIdentity: this.context.security.getIdentity,
            getPermissions: () => this.context.security.getPermissions<FilePermission>("fm.file"),
            fullAccessPermissionName: "fm.*"
        });

        const settingsPermissions = new SettingsPermissions({
            getIdentity: this.context.security.getIdentity,
            getPermissions: () =>
                this.context.security.getPermissions<SettingsPermission>("fm.settings"),
            fullAccessPermissionName: "fm.*"
        });

        return createFileManager({
            storageOperations,
            filesPermissions,
            settingsPermissions,
            getTenantId: this.getTenantId.bind(this),
            getLocaleCode: this.getLocaleCode.bind(this),
            getIdentity: this.getIdentity.bind(this),
            getPermissions: this.getPermissions.bind(this),
            storage: new FileStorage({
                context: this.context
            }),
            // TODO: maybe this is no longer necessary, as this wil be managed by CMS?
            WEBINY_VERSION: this.context.WEBINY_VERSION
        });
    }

    private getLocaleCode() {
        return getLocale().code;
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

    private async setupCmsStorageOperations(aliases: FileManagerAliasesStorageOperations) {
        if (!(await isHeadlessCmsReady(this.context))) {
            return;
        }

        const withPrivateFiles = this.context.wcp.canUsePrivateFiles();

        // This registers code plugins (model group, models)
        const fileModelDefinition = createFileModel({ withPrivateFiles });

        const modelModifiers = this.context.plugins.byType<CmsModelModifierPlugin>(
            CmsModelModifierPlugin.type
        );

        for (const modifier of modelModifiers) {
            await modifier.modifyModel(fileModelDefinition);
        }

        // Finally, register all plugins
        this.context.plugins.register([new CmsModelPlugin(fileModelDefinition)]);

        // Now load the file model registered in the previous step
        const fileModel = await this.getModel(FILE_MODEL_ID);

        // Overwrite the original `files` storage ops
        return await CmsFilesStorage.create({
            fileModel,
            cms: this.context.cms,
            aliases
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
