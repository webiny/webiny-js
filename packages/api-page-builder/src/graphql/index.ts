import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { createCrud } from "./crud";
import graphql from "./graphql";
import upgrades from "./upgrades";
import multiTenancy from "./multiTenancy";

export const createPageBuilderGraphQL = (): GraphQLSchemaPlugin[] => {
    return graphql();
};

export const createPageBuilderContext = () => {
    return [createCrud(), upgrades(), multiTenancy()];
};

export default () => {
    return [...createPageBuilderContext(), ...createPageBuilderGraphQL()];
};
