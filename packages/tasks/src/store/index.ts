import { ContextPlugin } from "@webiny/api";
import { Context } from "~/types";
import { createTaskModel } from "./model";
import { TaskCrud } from "./crud.tasks";

export const createCrud = () => {
    return [
        ...createTaskModel(),
        new ContextPlugin<Context>(async context => {
            context.tasks = new TaskCrud(context);
        })
    ];
};
