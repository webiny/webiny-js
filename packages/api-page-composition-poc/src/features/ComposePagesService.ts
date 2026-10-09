import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import {
    ComposePagesService as Abstraction,
    type CompositionTarget,
    PageMapStore
} from "~/domain/abstractions.js";
import { PageCompositionError } from "~/domain/errors.js";
import type { ComposePagesResult, PageMapEntry } from "~/domain/types.js";
import { CompositionReaderAbstraction } from "~/features/composition/CompositionReader.js";
import { CompositionWriterAbstraction } from "~/features/composition/CompositionWriter.js";

/**
 * Composes a run's pages: read in the extraction tenant, write in the pages' tenant, record the map
 * back in the extraction tenant.
 *
 * Without a target that is one tenant, and this behaves as composition always has. With one, the
 * writer runs inside `withTenant(target)`; the reader and the page map stay outside it. The split is
 * the safety: the writer has no extraction dependency, so a read that would land in the wrong tenant
 * cannot be written — see `CompositionWriter`.
 */
export class ComposePagesServiceImpl implements Abstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private reader: CompositionReaderAbstraction.Interface,
        private writer: CompositionWriterAbstraction.Interface,
        private pageMaps: PageMapStore.Interface
    ) {}

    async execute(
        runId: string,
        target?: CompositionTarget
    ): Promise<Result<ComposePagesResult, PageCompositionError>> {
        const read = await this.reader.read(runId, target?.tenant.id);
        if (read.isFail()) {
            return Result.fail(read.error);
        }
        const source = read.value;

        const promoted = target ? target.promoted : source.promoted;
        if (!promoted) {
            return Result.fail(
                new PageCompositionError(
                    "Page composition requires Promote to be done — a page addresses a component by the name it was promoted under."
                )
            );
        }

        const home = this.tenantContext.getTenant();
        const writeTenant = target ? target.tenant : home;

        // Only pages in the tenant being written to are this composition's to retire. A map without a
        // tenant was written into the run's own tenant.
        const retire: PageMapEntry[] = source.earlier
            .filter(earlier => (earlier.tenantId ?? home.id) === writeTenant.id)
            .flatMap(earlier => earlier.pages);

        const write = () =>
            this.writer.write({ source, promoted, retire, expectedTenantId: writeTenant.id });
        /*
         * PERMISSIONS, an open decision for a customer-facing deployment: the permission check reads
         * the wrong tenant. Permissions load per identity, not per tenant, so inside `withTenant`
         * every check reads the extraction tenant's grant and nothing checks the target's. Whoever
         * may compose may write into the target tenant. Accepted for dev and the demo only; see
         * compose-tenant-promotion-design.md.
         */
        const written = target
            ? await this.tenantContext.withTenant(target.tenant, write)
            : await write();
        if (written.isFail()) {
            return Result.fail(written.error);
        }
        const { created, failed, links, discarded } = written.value;

        const stored = await this.pageMaps.set({
            runId,
            composeVersion: source.composeVersion,
            composedOn: new Date().toISOString(),
            ...(target ? { tenantId: target.tenant.id } : {}),
            pages: created,
            failed,
            links,
            discarded
        });
        if (stored.isFail()) {
            return Result.fail(stored.error);
        }

        return Result.ok({ created: created.length, failed: failed.length, links });
    }
}

export const ComposePagesService = Abstraction.createImplementation({
    implementation: ComposePagesServiceImpl,
    dependencies: [
        TenantContext,
        CompositionReaderAbstraction,
        CompositionWriterAbstraction,
        PageMapStore
    ]
});
