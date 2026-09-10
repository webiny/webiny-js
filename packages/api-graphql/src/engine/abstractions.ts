import { createAbstraction } from "@webiny/feature/api";

export interface IGraphQLEngine {
    execute(body: any): Promise<any>;
}

export const GraphQLEngine = createAbstraction<IGraphQLEngine>("GraphQLEngine");

export namespace GraphQLEngine {
    export type Interface = IGraphQLEngine;
}
