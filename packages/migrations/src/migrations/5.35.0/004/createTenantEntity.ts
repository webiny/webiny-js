import { Table } from "dynamodb-toolbox";
import pick from "lodash.pick";
import { createLegacyEntity, createStandardEntity } from "~/utils";

const attributes: Parameters<typeof createLegacyEntity>[2] = {
    id: {
        type: "string"
    },
    name: {
        type: "string"
    },
    description: {
        type: "string"
    },
    status: {
        type: "string",
        default: "active"
    },
    createdOn: {
        type: "string"
    },
    savedOn: {
        type: "string"
    },
    createdBy: {
        type: "map"
    },
    parent: {
        type: "string"
    },
    webinyVersion: {
        type: "string"
    },
    settings: {
        type: "map",
        default: {}
    }
};

export const getTenantData = (tenant: any) => {
    return pick(tenant, Object.keys(attributes));
};

export const createLegacyTenantEntity = (table: Table) => {
    return createLegacyEntity(table, "TenancyTenant", attributes);
};

export const createNewTenantEntity = (table: Table) => {
    return createStandardEntity(table, "TenancyTenant", attributes);
};
