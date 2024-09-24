import { Tenant } from "@webiny/api-tenancy/types";
import Error from "@webiny/error";
import { Context } from "~/index";

export interface AdminUserInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    group?: string;
}

export type AdminUsersInstallationConfig = AdminUserInput | undefined;

export interface I18nInstallationConfig {
    defaultLocaleCode: string;
}

export interface FileManagerInstallationConfig {
    /**
     * Asset delivery origin. This usually points to the main Webiny API origin.
     * E.g., https://some.domain.com/
     *
     * You can change this later in the tenant's File Manager settings.
     */
    assetDeliveryDomain: string;
}

export interface PageBuilderInstallationConfig {
    websiteName: string;
    insertDemoData: boolean;
}

export interface TenantConfig {
    i18n: I18nInstallationConfig;
    adminUsers?: AdminUsersInstallationConfig;
    fileManager?: FileManagerInstallationConfig;
    pageBuilder?: PageBuilderInstallationConfig;
}

export class InstallTenant {
    private readonly context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async execute(tenant: Tenant, config: TenantConfig): Promise<void> {
        const currentTenant = this.context.tenancy.getCurrentTenant();

        // Get current tenant's FileManager settings.
        const fmSettings = await this.context.fileManager.getSettings();

        // Switch tenant to the one being installed.
        this.context.tenancy.setCurrentTenant(tenant);

        try {
            // TENANCY: Set the app version, as the tenant is already created.
            await this.context.tenancy.setVersion(this.context.WEBINY_VERSION);

            // SECURITY: Create initial security groups.
            await this.runOrThrow(async () => {
                const isInstalled = await this.context.security.getVersion();
                if (!isInstalled) {
                    await this.context.security.install();
                }
            }, "SECURITY_INSTALL");

            // ADMIN USERS: Optionally, create an admin user for this tenant.
            await this.runOrThrow(async () => {
                const isInstalled = await this.context.adminUsers.getVersion();
                if (isInstalled) {
                    return;
                }

                if (config.adminUsers) {
                    await this.context.adminUsers.install(config.adminUsers);
                } else {
                    // We always mark `adminUsers` as installed, regardless of the config.
                    await this.context.adminUsers.setVersion(this.context.WEBINY_VERSION);
                }
            }, "ADMIN_USERS_INSTALL");

            // I18N: Create a default locale.
            await this.runOrThrow(async () => {
                const isInstalled = await this.context.i18n.system.getSystemVersion();
                if (isInstalled) {
                    return;
                }

                await this.context.i18n.system.installSystem({
                    code: config.i18n.defaultLocaleCode
                });
            }, "I18N_INSTALL");

            // CMS
            await this.runOrThrow(async () => {
                const isInstalled = await this.context.cms.getSystemVersion();
                if (isInstalled) {
                    return;
                }
                await this.context.cms.installSystem();
            }, "CMS_INSTALL");

            // FILE MANAGER: Create File Manager settings.
            const srcPrefix = config.fileManager
                ? `${new URL(config.fileManager.assetDeliveryDomain).origin}/files/`
                : fmSettings?.srcPrefix;

            await this.runOrThrow(async () => {
                const isInstalled = await this.context.fileManager.getVersion();
                if (isInstalled) {
                    return;
                }

                await this.context.fileManager.install({ srcPrefix: srcPrefix || "" });
            }, "FILE_MANAGER_INSTALL");

            // PAGE BUILDER: Create Page Builder settings.
            await this.runOrThrow(async () => {
                const isInstalled = await this.context.pageBuilder.getSystemVersion();
                if (isInstalled) {
                    return;
                }
                await this.context.pageBuilder.installSystem({
                    name: config.pageBuilder?.websiteName ?? tenant.name,
                    insertDemoData: config.pageBuilder?.insertDemoData ?? false
                });
            }, "PAGE_BUILDER_INSTALL");

            // FORM BUILDER
            await this.runOrThrow(async () => {
                const isInstalled = await this.context.formBuilder.getSystemVersion();
                if (isInstalled) {
                    return;
                }
                await this.context.formBuilder.installSystem({});
            }, "FORM_BUILDER_INSTALL");
        } finally {
            this.context.tenancy.setCurrentTenant(currentTenant);
        }
    }

    private async runOrThrow(cb: () => Promise<void>, errorCode: string): Promise<void> {
        try {
            await cb();
        } catch (err) {
            throw new Error({
                message: err.message,
                code: `INSTALL_TENANT:${errorCode}`,
                data: {
                    error: err
                }
            });
        }
    }
}
