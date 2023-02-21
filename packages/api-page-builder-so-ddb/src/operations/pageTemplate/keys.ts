import { PageTemplate } from "@webiny/api-page-builder/types";

export type PrimaryPKParams = Pick<PageTemplate, "id" | "tenant" | "locale">;
export type GSI1Params = Pick<PageTemplate, "tenant" | "locale">;

export const createPrimaryPK = ({ id, tenant, locale }: PrimaryPKParams): string => {
    return `T#${tenant}#L#${locale}#PB#TEMPLATE#${id}`;
};

export const createGSI1PK = ({ tenant, locale }: GSI1Params): string => {
    return `T#${tenant}#L#${locale}#PB#TEMPLATES`;
};
