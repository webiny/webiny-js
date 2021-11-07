import graphql from "./graphql";
import { createAdminCruds, Params as CreateAdminCrudsParams } from "./crud";
import context from "./context";
import upgrades from "./upgrades";

export interface Params extends CreateAdminCrudsParams {
    // empty for now
}

export const createAdminHeadlessCms = (params: Params) => {
    return [context(), createAdminCruds(params), graphql(), upgrades()];
};
