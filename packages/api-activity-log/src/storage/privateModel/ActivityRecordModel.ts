import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const ACTIVITY_LOG_MODEL_ID = "wbyActivityLog";

/**
 * The activity record as a private CMS model.
 *
 * Field choices are driven entirely by what has to be filterable. `revision` and `actorId` are
 * top-level text fields because the read API narrows on them; everything describing *what*
 * changed lives in the `changeset` JSON blob, which nothing queries.
 *
 * `changeset` holds paths, hashes, labels and operations. It never holds a value, before or
 * after, in any form.
 */
class ActivityRecordModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: ACTIVITY_LOG_MODEL_ID,
                    name: "Activity Log"
                })
                .fields(fields => ({
                    targetType: fields
                        .text()
                        .label("Target Type")
                        .required("Target type is required."),
                    targetId: fields.text().label("Target ID").required("Target ID is required."),
                    revision: fields.text().label("Revision").required("Revision is required."),
                    // `datetime()` defaults to `"date"` — date only, time silently discarded —
                    // so the variant has to be stated. `withTimezone()` keeps the offset that
                    // `toISOString()` writes, which makes each record an unambiguous instant
                    // rather than one that relies on a convention about which zone it meant.
                    //
                    // Records are always written as ISO-8601 UTC, so the `timestamp_DESC` sort
                    // stays chronological: same-format UTC strings sort lexicographically. Mixed
                    // offsets would break that, which is why the write side never emits one.
                    timestamp: fields
                        .datetime()
                        .label("Timestamp")
                        .required("Timestamp is required.")
                        .withTimezone(),
                    actorId: fields.text().label("Actor ID").required("Actor ID is required."),
                    actorType: fields
                        .text()
                        .label("Actor Type")
                        .required("Actor type is required."),
                    actorDisplayName: fields.text().label("Actor Display Name"),
                    action: fields.text().label("Action").required("Action is required."),
                    source: fields.text().label("Source").required("Source is required."),
                    correlationId: fields
                        .text()
                        .label("Correlation ID")
                        .required("Correlation ID is required."),
                    changeset: fields.json().label("Changeset"),
                    truncated: fields.boolean().label("Changeset Truncated")
                }))
        ];
    }
}

export const ActivityRecordModel = ModelFactory.createImplementation({
    implementation: ActivityRecordModelImpl,
    dependencies: []
});
