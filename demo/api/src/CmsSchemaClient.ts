import { Context } from "./types";
import { ExecutionResult } from "graphql";
import Error from "@webiny/error";

export interface QueryParams {
    query: string;
    variables: Record<string, any>;
    operationName: string;
}

export class CmsSchemaClient {
    private context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    async read<TQueryResponse>(params: QueryParams) {
        const executableSchema = await this.context.cms.getExecutableSchema("read");

        const { data, errors } = (await executableSchema(
            params
        )) as ExecutionResult<TQueryResponse>;

        if (!data) {
            console.log(errors);
            throw new Error({
                code: "CmsSchemaClientError",
                message: "Failed to execute query!",
                data: params
            });
        }

        return { data, errors };
    }

    async preview<TQueryResponse>(params: QueryParams) {
        const executableSchema = await this.context.cms.getExecutableSchema("preview");

        const { data, errors } = (await executableSchema(
            params
        )) as ExecutionResult<TQueryResponse>;

        if (!data) {
            console.log(errors);
            throw new Error({
                code: "CmsSchemaClientError",
                message: "Failed to execute query!",
                data: params
            });
        }

        return { data, errors };
    }
}
