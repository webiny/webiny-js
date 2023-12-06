import { PluginsContainer } from "@webiny/plugins";
import { createRegisterTaskPlugin, TaskPlugin } from "~/task/plugin";
import { createTaskField } from "~/task/definition";
import { ITaskField } from "~/types";

describe("task plugin", () => {
    it("should create a task plugin", async () => {
        const container = new PluginsContainer();

        const plugin = createRegisterTaskPlugin({
            id: "myCustomTask",
            name: "A custom task defined via method",
            description: "A custom task description defined via method",
            run: async ({ response, isCloseToTimeout, input }) => {
                try {
                    if (isCloseToTimeout()) {
                        return response.continue({
                            input
                        });
                    }
                    return response.done();
                } catch (ex) {
                    return response.error(ex);
                }
            },
            onDone: async () => {
                return;
            },
            onError: async () => {
                return;
            },
            fields: [
                createTaskField({
                    type: "text",
                    fieldId: "url",
                    label: "URL"
                })
            ]
        });

        container.register(plugin);

        const results = container.byType<TaskPlugin>(TaskPlugin.type);
        expect(results).toHaveLength(1);
        const [result] = results;

        expect(result).toBeDefined();
        expect(result.getTask()).toBeDefined();
        expect(result.getTask().id).toEqual("myCustomTask");
        expect(result.getTask().name).toEqual("A custom task defined via method");
        expect(result.getTask().description).toEqual(
            "A custom task description defined via method"
        );
        expect(result.getTask().run).toBeInstanceOf(Function);
        expect(result.getTask().onDone).toBeInstanceOf(Function);
        expect(result.getTask().onError).toBeInstanceOf(Function);
        expect(result.getTask().fields).toHaveLength(1);
        const field = result.getTask().fields?.[0] as ITaskField;
        expect(field).toBeDefined();
        expect(field).toBeInstanceOf(Object);
        expect(field.fieldId).toEqual("url");
        expect(field.type).toEqual("text");
        expect(field.label).toEqual("URL");
    });
});
