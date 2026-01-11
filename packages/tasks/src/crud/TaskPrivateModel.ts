import { PrivateModel } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { TaskDataStatus } from "~/types.js";

export const WEBINY_TASK_MODEL_ID = "webinyTask";

class TaskPrivateModelImpl implements PrivateModel.Interface {
    buildModel(builder: PrivateModel.Builder): PrivateModel.Builder {
        return builder
            .modelId(WEBINY_TASK_MODEL_ID)
            .name("Webiny Task")
            .fields((fields: PrivateModel.FieldBuilder) => ({
                name: fields.text().label("Name").required("Name is required."),
                definitionId: fields
                    .text()
                    .label("Definition ID")
                    .required("Definition ID is required."),
                parentId: fields.text().label("Parent ID"),
                executionName: fields.text().label("Execution Name"),
                iterations: fields.number().label("Iterations"),
                input: fields.json().label("Input"),
                output: fields.json().label("Output"),
                taskStatus: fields
                    .text()
                    .label("Status")
                    .predefinedValues([
                        {
                            value: TaskDataStatus.PENDING,
                            label: "Pending"
                        },
                        {
                            value: TaskDataStatus.RUNNING,
                            label: "Running"
                        },
                        {
                            value: TaskDataStatus.FAILED,
                            label: "Failed"
                        },
                        {
                            value: TaskDataStatus.SUCCESS,
                            label: "Success"
                        },
                        {
                            value: TaskDataStatus.ABORTED,
                            label: "Aborted"
                        }
                    ])
                    .settings({ defaultValue: TaskDataStatus.PENDING }),
                startedOn: fields.datetime().label("Started On"),
                finishedOn: fields.datetime().label("Finished On"),
                eventResponse: fields.json().label("Event Response")
            }));
    }
}

export const TaskPrivateModel = PrivateModel.createImplementation({
    implementation: TaskPrivateModelImpl,
    dependencies: []
});
