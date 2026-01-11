import { PrivateModel } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { TaskLogItemType } from "~/types.js";

export const WEBINY_TASK_LOG_MODEL_ID = "webinyTaskLog";

class TaskLogPrivateModelImpl implements PrivateModel.Interface {
    buildModel(builder: PrivateModel.Builder): PrivateModel.Builder {
        return builder
            .modelId(WEBINY_TASK_LOG_MODEL_ID)
            .name("Webiny Task Log")
            .fields((fields: PrivateModel.FieldBuilder) => ({
                executionName: fields.text().label("Execution Name"),
                task: fields.text().label("Task").required("Task is required."),
                iteration: fields.number().label("Iteration").required("Iteration is required."),
                items: fields
                    .object()
                    .label("Items")
                    .list()
                    .required("Items is required.")
                    .fields((itemFields: PrivateModel.FieldBuilder) => ({
                        message: itemFields
                            .text()
                            .label("Message")
                            .required("Message is required."),
                        createdOn: itemFields
                            .datetime()
                            .label("Created On")
                            .required("Created On is required."),
                        type: itemFields
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
                        data: itemFields.json().label("Data"),
                        error: itemFields.json().label("Error")
                    }))
            }));
    }
}

export const TaskLogPrivateModel = PrivateModel.createImplementation({
    implementation: TaskLogPrivateModelImpl,
    dependencies: []
});
