import { Result } from "@webiny/feature/api";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { CreateTenantUseCase as CreateTmTenantUseCase } from "@webiny/tenant-manager/api/features/CreateTenant/abstractions.js";
import { CreateAndInstallTenantUseCase } from "@webiny/tenant-manager/api/features/CreateAndInstallTenant/abstractions.js";
import { SiteTenant } from "@webiny/api-component-extraction/domain/abstractions.js";
import type { Job } from "@webiny/api-component-extraction/domain/types.js";
import {
    ExtractionValidationError,
    type ExtractionError
} from "@webiny/api-component-extraction/domain/errors.js";
import { type SiteRecord, SiteStore } from "~/storage/SiteStore.js";
import { siteTenantId } from "./BuildSiteTask.js";

/**
 * Creates a job's site tenant at its first approval, or finds the one on record, for jobs created with
 * `siteTenantFromStart`. The site build keeps its own creation for older jobs, unchanged, so their
 * path is exactly what it was.
 *
 * A root operation: it runs in the extraction tenant, where the site record lives and where Tenant
 * Manager creates tenants.
 */
class SiteTenantServiceImpl implements SiteTenant.Interface {
    constructor(
        private sites: SiteStore.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface,
        private createTmTenant: CreateTmTenantUseCase.Interface,
        private createAndInstall: CreateAndInstallTenantUseCase.Interface
    ) {}

    async ensure(job: Job): Promise<Result<Tenant, ExtractionError>> {
        const existing = await this.sites.get(job.id);
        const site: SiteRecord = existing ?? {
            jobId: job.id,
            tenantId: siteTenantId(job.name, job.id),
            tenantName: job.name,
            createdOn: new Date().toISOString()
        };
        const tenant = await this.ensureTenant(site.tenantId, site.tenantName);
        if (typeof tenant === "string") {
            return Result.fail(new ExtractionValidationError(tenant));
        }
        if (!existing) {
            const saved = await this.sites.set(site);
            if (saved.isFail()) {
                return Result.fail(new ExtractionValidationError(saved.error.message));
            }
        }
        return Result.ok(tenant);
    }

    /** The tenant: the one on record, or created now. A string is the reason it failed. */
    async ensureTenant(tenantId: string, tenantName: string): Promise<Tenant | string> {
        const found = await this.getTenantById.execute(tenantId);
        if (found.isOk()) {
            return found.value;
        }
        const entry = await this.createTmTenant.execute({
            id: tenantId,
            name: tenantName,
            description: `The migrated site of the extraction job "${tenantName}".`,
            extensions: {}
        });
        if (entry.isFail()) {
            return `Could not create the tenant: ${entry.error.message}`;
        }
        const installed = await this.createAndInstall.execute(entry.value.id);
        if (installed.isFail()) {
            return `Could not install the tenant: ${installed.error.message}`;
        }
        const created = await this.getTenantById.execute(tenantId);
        return created.isOk() ? created.value : `The tenant was created but cannot be read.`;
    }
}

export const SiteTenantService = SiteTenant.createImplementation({
    implementation: SiteTenantServiceImpl,
    dependencies: [SiteStore, GetTenantByIdUseCase, CreateTmTenantUseCase, CreateAndInstallTenantUseCase]
});
