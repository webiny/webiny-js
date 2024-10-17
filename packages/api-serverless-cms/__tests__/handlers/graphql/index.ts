import { createInstallGraphQL } from "./install";
import { ICreateMutationCb, ICreateQueryCb } from "~tests/handlers/helpers/factory/types";

export interface ICreateGraphQlParams {
    createQuery: ICreateQueryCb;
    createMutation: ICreateMutationCb;
}

export const createGraphQl = (params: ICreateGraphQlParams) => {
    return {
        ...createInstallGraphQL(params)
    };
};
