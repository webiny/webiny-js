import { createInstallGraphQL } from "./install";
import { ICreateQueryCb } from "~tests/handlers/helpers/query/types";

export const createGraphQl = (createQuery: ICreateQueryCb) => {
    return {
        ...createInstallGraphQL(createQuery)
    };
};
