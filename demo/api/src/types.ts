import { Context as BaseContext } from "api-graphql/src/types";
import { Tenant } from "@webiny/api-tenancy/types";

export interface Context extends BaseContext {
    requestedTenant: Tenant;
}

export type CreateEmployeeInput = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

export type UpdateEmployeeInput = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

export interface ArticlesListOpts {
    search?: string;
    limit?: number;
    after?: string;
    where?: Record<string, any>;
}

export interface ArticleCloneOpts {
    id: string;
    language: string;
}
