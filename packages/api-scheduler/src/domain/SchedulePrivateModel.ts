import { PrivateModel } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { SCHEDULE_MODEL_ID } from "~/constants.js";

class SchedulePrivateModelImpl implements PrivateModel.Interface {
    buildModel(builder: PrivateModel.Builder): PrivateModel.Builder {
        return builder
            .modelId(SCHEDULE_MODEL_ID)
            .name("Webiny CMS Schedule")
            .fields((fields: PrivateModel.FieldBuilder) => ({
                namespace: fields.text().label("Namespace"),
                actionType: fields.text().label("Action Type"),
                targetId: fields.text().label("Target ID"),
                scheduledBy: fields
                    .object()
                    .label("Scheduled By")
                    .fields((scheduledByFields: PrivateModel.FieldBuilder) => ({
                        id: scheduledByFields.text().label("Identity ID"),
                        displayName: scheduledByFields.text().label("Display Name"),
                        type: scheduledByFields.text().label("Type")
                    })),
                scheduledOn: fields.datetime().label("Scheduled On"),
                dateOn: fields.datetime().label("Date On"),
                title: fields.text().label("Title"),
                error: fields.text().label("Error"),
                payload: fields.json().label("Payload")
            }));
    }
}

export const SchedulePrivateModel = PrivateModel.createImplementation({
    implementation: SchedulePrivateModelImpl,
    dependencies: []
});
