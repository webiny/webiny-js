import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { TaskLogItemType } from "~/api/types.js";

export const WEBINY_TASK_LOG_MODEL_ID = "wbyTaskLog";

class TaskLogPrivateModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: WEBINY_TASK_LOG_MODEL_ID,
                    name: "Webiny Task Log"
                })
                .fields(fields => ({
                    executionName: fields.text().label("Execution Name"),
                    task: fields.text().label("Task").required("Task is required."),
                    iteration: fields
                        .number()
                        .label("Iteration")
                        .required("Iteration is required."),
                    items: fields
                        .object()
                        .label("Items")
                        .list()
                        .required("Items is required.")
                        .fields(fields => ({
                            message: fields
                                .text()
                                .label("Message")
                                .required("Message is required."),
                            createdOn: fields
                                .datetime()
                                .label("Created On")
                                .required("Created On is required."),
                            type: fields
                                .text()
                                .label("Type")
                                .required("Type is required.")
                                .predefinedValues([
                                    {
                                        value: TaskLogItemType.INFO,
                                        label: "Info"
                                    },
                                    {
                                        value: TaskLogItemType.ERROR,
                                        label: "Error"
                                    }
                                ]),
                            data: fields.json().label("Data"),
                            error: fields.json().label("Error")
                        }))
                }))
        ];
    }
}

export const TaskLogPrivateModel = ModelFactory.createImplementation({
    implementation: TaskLogPrivateModelImpl,
    dependencies: []
});
