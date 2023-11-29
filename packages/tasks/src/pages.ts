import { ListPagesParamsWhere, PbContext } from "@webiny/api-page-builder/types";
import { createTaskInput } from "~/tasks/taskInput";
import {createTaskDefinition, TaskDefinition} from "./task";
import { Context } from "~/types";

export const TASK_TYPE = "pageBuilder.publishPage";

interface Params {
    where?: ListPagesParamsWhere;
}
export const createPublishPageTask = (params: Params, assets) => {
    return createTaskInput({
        // this type must be registered somewhere in the system
        type: TASK_TYPE,
        input: params,
        assets,
    });
};

const model = createTaskModel({
    fields: [
        createStringField("file"),
        createNumberField("age"),
    ]
})

class PublishPageTask implements TaskDefinition<Context, Params> {
    
    input() {
        return model;
    }
    async execute() {
        //
        if (jos) {
            return await registry.addTasks([], {
                await: true,
            })
        }
    }
}

const plugin = createTaskDefinition<Params>(TASK_TYPE, async taskParams => {
    
    return new PublishPageTask();
    return {
        model,
        run: async (context: Context, input) => {
            const { where, after } = input;
            
            
            const pages = query({
                limit: 100,
            });
            
            for () {
                publish
            }
            
        },
        onAlmostTimeout: async () => {}
    };
});


createHandler({
    plguins: [
        plugin,
    ]
})
