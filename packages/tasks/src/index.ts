import "./handler/register";
import { Plugin } from "@webiny/plugins/types";
import { createCrud } from "~/crud";
import { createGraphQL } from "~/graphql";

export const createBackgroundTaskGraphQL = (): Plugin[] => {
    return [createGraphQL()];
};
export const createBackgroundTaskContext = (): Plugin[] => {
    return createCrud();
};
