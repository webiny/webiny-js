import "./handler/register";
import { Plugin } from "@webiny/plugins/types";
import { createCrud } from "~/crud";

export const createBackgroundTaskContext = (): Plugin[] => {
    return createCrud();
};
