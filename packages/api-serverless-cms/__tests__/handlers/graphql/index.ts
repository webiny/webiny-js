import { createInstallGraphQL } from "./install";
import { ICreateMutationCb, ICreateQueryCb } from "~tests/handlers/helpers/factory/types";
import { createMockLogIn } from "./login";
// import { createMockLogIn } from "~tests/handlers/graphql/login";

export interface ICreateGraphQlParams {
    createQuery: ICreateQueryCb;
    createMutation: ICreateMutationCb;
}

export const createGraphQl = (params: ICreateGraphQlParams) => {
    return {
        ...createInstallGraphQL(params),
        ...createMockLogIn(params)
    };
};
