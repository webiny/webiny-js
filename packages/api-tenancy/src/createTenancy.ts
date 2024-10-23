import { createTopic } from "@webiny/pubsub";
import { Tenant, TenancyStorageOperations, Tenancy } from "./types";
import { createSystemMethods } from "~/createTenancy/createSystemMethods";
import { createTenantsMethods } from "~/createTenancy/createTenantsMethods";
import { Topic } from "@webiny/pubsub/types";

export interface TenancyConfig {
    tenant: string | null;
    storageOperations: TenancyStorageOperations;
    multiTenancy?: boolean;
    incrementWcpTenants: () => Promise<void>;
    decrementWcpTenants: () => Promise<void>;
}

const withToString = (tenant: Tenant) => {
    return {
        ...tenant,
        toString() {
            return this.id;
        }
    };
};

/**
 * This safeguard is for the core team, in case at some point this event gets published multiple times.
 */
const lockToOnePublish = (topic: Topic) => {
    let published = false;
    const original = topic.publish;
    topic.publish = (...args) => {
        if (published) {
            throw new Error(`"onTenantAfterInstall" can only be published once!`);
        }
        published = true;

        return original(...args);
    };
    return topic;
};

export async function createTenancy({
    tenant,
    storageOperations,
    multiTenancy = false,
    incrementWcpTenants,
    decrementWcpTenants
}: TenancyConfig): Promise<Tenancy> {
    let currentTenant: Tenant | null = null;

    const tenancy: Tenancy = {
        onTenantAfterInstall: lockToOnePublish(createTopic("tenancy.onTenantAfterInstall")),
        getStorageOperations() {
            return storageOperations;
        },
        getCurrentTenant<TTenant extends Tenant = Tenant>(): TTenant {
            return currentTenant as TTenant;
        },
        isMultiTenant() {
            return multiTenancy;
        },
        setCurrentTenant(tenant: Tenant) {
            currentTenant = withToString(tenant);
        },
        async withRootTenant(cb) {
            const initialTenant = this.getCurrentTenant();
            const rootTenant = await this.getRootTenant();
            this.setCurrentTenant(rootTenant);
            try {
                return await cb();
            } finally {
                // Make sure that, whatever happens in the callback, the tenant is set back to the initial one.
                tenancy.setCurrentTenant(initialTenant);
            }
        },
        async withEachTenant(tenants, cb) {
            const initialTenant = this.getCurrentTenant();
            const results = [];
            for (const tenant of tenants) {
                this.setCurrentTenant(tenant);
                try {
                    results.push(await cb(tenant));
                } finally {
                    this.setCurrentTenant(initialTenant);
                }
            }
            return results;
        },
        async withTenant(tenant, cb) {
            const initialTenant = this.getCurrentTenant();
            this.setCurrentTenant(tenant);
            const result = await cb(tenant);
            this.setCurrentTenant(initialTenant);
            return result;
        },
        ...createSystemMethods({ storageOperations }),
        ...createTenantsMethods({ storageOperations, incrementWcpTenants, decrementWcpTenants })
    };

    if (tenant) {
        currentTenant = await tenancy.getTenantById(tenant);
    }

    return tenancy;
}
