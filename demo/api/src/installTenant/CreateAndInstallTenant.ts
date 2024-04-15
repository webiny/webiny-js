import { Tenant } from "@webiny/api-tenancy/types";
import { parseIdentifier } from "@webiny/utils";
import Error from "@webiny/error";
import { Company } from "@demo/admin/src/types";
import { Context } from "../types";

export class CreateAndInstallTenant {
    private readonly context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async execute(companyId: string) {
        const { id: entryId } = parseIdentifier(companyId);
        const { cms, tenancy } = this.context;

        const companyModel = await this.getCompanyModel();

        const entry = await cms.getEntry(companyModel, { where: { entryId, latest: true } });
        const company = entry.values as Company;

        const tenant = await tenancy.createTenant({
            id: entryId,
            name: company.name,
            parent: "root",
            description: company.name,
            tags: []
        });

        await this.installTenant(tenant);

        // Mark Company installed.
        if (entry.locked) {
            await cms.createEntryRevisionFrom(companyModel, entry.id, { isInstalled: true });
        } else {
            await cms.updateEntry(companyModel, companyId, { ...company, isInstalled: true });
        }
    }

    private async getCompanyModel() {
        const companyModel = await this.context.cms.getModel("company");

        if (!companyModel) {
            throw new Error(`Model "company" was not found!`);
        }

        return companyModel;
    }

    private async installTenant(tenant: Tenant) {
        const rootTenant = this.context.tenancy.getCurrentTenant();

        // Get "root" tenant FileManager settings.
        const fmSettings = await this.context.fileManager.getSettings();

        // Switch tenant to the one being installed.
        this.context.tenancy.setCurrentTenant(tenant);

        try {
            // Set the app version, as the tenant is already created.
            await this.context.tenancy.setVersion(this.context.WEBINY_VERSION);
            await this.context.security.install();
            // Skip user creation, and simply set the app version, which marks the app as "installed".
            await this.context.adminUsers.setVersion(this.context.WEBINY_VERSION);
            await this.context.i18n.system.installSystem({
                code: "en-US"
            });
            await this.context.cms.installSystem();
            await this.context.fileManager.install({ srcPrefix: fmSettings?.srcPrefix || "" });
            await this.context.pageBuilder.installSystem({
                name: tenant.name,
                insertDemoData: false
            });
            await this.context.formBuilder.installSystem({ domain: "" });
        } catch (e) {
            // Remove the tenant that was created in the process.
            await this.context.tenancy.deleteTenant(tenant.id);

            throw new Error({
                message: e.message,
                code: "INSTALL_TENANT_FROM_COMPANY",
                data: {
                    companyId: tenant.id,
                    error: e
                }
            });
        } finally {
            this.context.tenancy.setCurrentTenant(rootTenant);
        }
    }
}
