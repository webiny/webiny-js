import graphql from "./graphql";
import { createAdminCruds, Params as CreateAdminCrudsParams } from "./crud";
import context from "./context";
import upgrades from "./upgrades";

export type Params = CreateAdminCrudsParams;

export const createAdminHeadlessCms = (params: Params) => {
    return [context(), createAdminCruds(params), graphql(), upgrades()];
};
