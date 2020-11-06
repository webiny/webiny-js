import { PbElement } from "@webiny/app-page-builder/types";
import ApolloClient from "apollo-client";

export type UpdateElementActionArgsType = {
    element: PbElement;
    merge?: boolean;
    history?: boolean;
    client?: ApolloClient<any>;
};
