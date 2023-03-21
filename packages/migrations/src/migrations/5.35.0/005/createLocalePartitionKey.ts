import { Tenant } from "./types";

interface Params {
    tenant: Tenant;
}

export const createLocalePartitionKey = ({ tenant }: Params) => {
    return `T#${tenant.id}#I18N#L`;
};
