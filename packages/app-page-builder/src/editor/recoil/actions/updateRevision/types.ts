import ApolloClient from "apollo-client";
import { PageAtomType } from "@webiny/app-page-builder/editor/recoil/modules";

export type UpdatePageRevisionActionArgsType = {
    page: Omit<PageAtomType, "content">;
    client: ApolloClient<any>;
    onFinish?: () => void;
};
