import "./handler/register";
import { Plugin } from "@webiny/plugins/types";
import { createCrud } from "~/store";

export const createBackgroundTaskContext = (): Plugin[] => {
    return createCrud();
};
