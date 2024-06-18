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
            await this.context.security.install();

            // ADMIN USERS: Optionally, create an admin user for this tenant.
            if (config.adminUsers) {
                await this.context.adminUsers.install(config.adminUsers);
            } else {
                // We always mark `adminUsers` as installed, regardless of the config.
                await this.context.adminUsers.setVersion(this.context.WEBINY_VERSION);
            }

            // I18N: Create a default locale.
            await this.context.i18n.system.installSystem({
                code: config.i18n.defaultLocaleCode
            });

            // CMS
            await this.context.cms.installSystem();

            // FILE MANAGER: Create File Manager settings.
            const srcPrefix = config.fileManager
                ? `${new URL(config.fileManager.assetDeliveryDomain).origin}/files/`
                : fmSettings?.srcPrefix;

            await this.context.fileManager.install({ srcPrefix: srcPrefix || "" });

            // PAGE BUILDER: Create Page Builder settings.
            await this.context.pageBuilder.installSystem({
                name: config.pageBuilder?.websiteName ?? tenant.name,
                insertDemoData: config.pageBuilder?.insertDemoData ?? false
            });

            // FORM BUILDER
            await this.context.formBuilder.installSystem({});
        } catch (e) {
            throw new Error({
                message: e.message,
                code: "INSTALL_TENANT",
                data: {
                    config,
                    error: e
                }
            });
        } finally {
            this.context.tenancy.setCurrentTenant(currentTenant);
        }
    }
}
