import type { IIndexManager } from "~/settings/types.js";
import { listIndexes } from "./listIndexes.js";
import { createIndexFactory } from "~/tasks/createIndexes/createIndex.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { OpensearchTenantIndexFactory } from "~/abstractions/OpensearchTenantIndexFactory.js";
import { OnBeforeTrigger as Abstraction } from "./abstractions/OnBeforeTrigger.js";

class OnBeforeTriggerImpl implements Abstraction.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly indexFactories: OpensearchTenantIndexFactory.Interface[]
    ) {}

    public async run(targets: string[] | undefined, indexManager: IIndexManager): Promise<void> {
        const tenant = this.tenantContext.getTenant();
        if (!tenant) {
            throw new Error("Something went wrong, tenant not found when triggering a task.");
        }

        try {
            const allIndexes = await listIndexes(this.tenantContext, [tenant], this.indexFactories);

            const indexes = allIndexes.filter(index => {
                if (!targets?.length) {
                    return true;
                }
                for (const t of targets) {
                    if (index.index.includes(t)) {
                        return true;
                    }
                }
                return false;
            });
            if (indexes.length === 0) {
                console.warn(
                    "There are no indexes to create before triggering the Create indexes task.",
                    {
                        targets
                    }
                );
                return;
            }

            const createIndex = createIndexFactory(indexManager);

            for (const { index, settings } of indexes) {
                try {
                    console.log("Creating index", index);
                    await createIndex.createIfNotExists(index, settings);
                } catch (ex) {
                    console.error(`Failed to create index "${index}".`, ex);
                }
            }
        } catch (ex) {
            console.error(ex);
        }
    }
}

export const OnBeforeTrigger = Abstraction.createImplementation({
    implementation: OnBeforeTriggerImpl,
    dependencies: [TenantContext, [OpensearchTenantIndexFactory, { multiple: true }]]
});
