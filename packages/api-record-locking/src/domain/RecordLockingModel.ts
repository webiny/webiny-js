import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const RECORD_LOCKING_MODEL_ID = "wby_recordLocking";

class RecordLockingPrivateModelImpl implements ModelFactory.Interface {
    execute(builder: ModelFactory.Builder) {
        return builder
            .private()
            .modelId(RECORD_LOCKING_MODEL_ID)
            .name("Record Lock Tracking")
            .fields(fields => ({
                targetId: fields.text().label("Target ID").required("Target ID is required."),
                type: fields.text().label("Record Type").required("Record type is required."),
                actions: fields
                    .object()
                    .label("Actions")
                    .list()
                    .fields(fields => ({
                        type: fields
                            .text()
                            .label("Action Type")
                            .required("Action type is required."),
                        message: fields.text().label("Message"),
                        createdBy: fields
                            .object()
                            .label("Created By")
                            .required("Created by is required.")
                            .fields(fields => ({
                                id: fields.text().label("ID").required("ID is required."),
                                displayName: fields
                                    .text()
                                    .label("Display Name")
                                    .required("Display name is required."),
                                type: fields.text().label("Type").required("Type is required.")
                            })),
                        createdOn: fields
                            .datetime()
                            .label("Created On")
                            .required("Created on is required.")
                            .withoutTimezone()
                    }))
            }));
    }
}

export const RecordLockingModel = ModelFactory.createImplementation({
    implementation: RecordLockingPrivateModelImpl,
    dependencies: []
});
