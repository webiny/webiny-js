import { ContextPlugin } from "@webiny/api";
import { Context } from "~/types";

export const createStore = () => {
    return new ContextPlugin<Context>(async context => {
        context.tasks = createCrud();
    });
};
