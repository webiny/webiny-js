import { createGraphQLPlugin } from "./graphql";
import { createAdminCruds, Params as CreateAdminCrudsParams } from "./crud";
import context from "./context";
import upgrades from "./upgrades";

export interface Params extends CreateAdminCrudsParams {
    setupGraphQL?: boolean;
}

export const createAdminHeadlessCms = (params: Params) => {
    const plugins: any = [context(), createAdminCruds(params), upgrades()];
    /**
     * By default we include the GraphQL.
     */
    if (params.setupGraphQL !== false) {
        plugins.push(createGraphQLPlugin());
    }
    return plugins;
};
