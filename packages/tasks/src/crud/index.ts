import { Plugin } from "@webiny/plugins";
import { ContextPlugin } from "@webiny/api";
import { Context } from "~/types";
import { createTaskModel } from "./model";
import { createTaskCrud } from "./crud.tasks";
import { createDefinitionCrud } from "./definition.tasks";

export const createCrud = (): Plugin[] => {
    return [
        ...createTaskModel(),
        new ContextPlugin<Context>(async context => {
            context.tasks = {
                ...createDefinitionCrud(context),
                ...createTaskCrud(context)
            };
        })
    ];
};
