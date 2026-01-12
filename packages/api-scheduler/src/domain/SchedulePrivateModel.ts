import { Model } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { SCHEDULE_MODEL_ID } from "~/constants.js";

class SchedulePrivateModelImpl implements Model.Interface {
    buildModel(builder: Model.Builder) {
        return builder
            .private()
            .modelId(SCHEDULE_MODEL_ID)
            .name("Webiny CMS Schedule")
            .fields(fields => ({
                namespace: fields.text().label("Namespace"),
                actionType: fields.text().label("Action Type"),
                targetId: fields.text().label("Target ID"),
                scheduledBy: fields
                    .object()
                    .label("Scheduled By")
                    .fields(fields => ({
                        id: fields.text().label("Identity ID"),
                        displayName: fields.text().label("Display Name"),
                        type: fields.text().label("Type")
                    })),
                scheduledOn: fields.datetime().label("Scheduled On"),
                dateOn: fields.datetime().label("Date On"),
                title: fields.text().label("Title"),
                error: fields.text().label("Error"),
                payload: fields.json().label("Payload")
            }));
    }
}

export const SchedulePrivateModel = Model.createImplementation({
    implementation: SchedulePrivateModelImpl,
    dependencies: []
});
