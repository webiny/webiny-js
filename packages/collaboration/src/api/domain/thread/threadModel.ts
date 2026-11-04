import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { CollabThreadType } from "~/api/domain/thread/abstractions.js";
import { COLLAB_THREAD_MODEL_ID } from "~/shared/constants.js";

const types = [
    {
        label: "Note",
        value: CollabThreadType.note
    },
    {
        label: "Task",
        value: CollabThreadType.task
    }
];

class CollabThreadModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: COLLAB_THREAD_MODEL_ID,
                    name: "Collaboration Thread"
                })
                .fields(fields => ({
                    contentType: fields
                        .text()
                        .label("Content Type")
                        .required("Content type is required."),
                    contentId: fields
                        .text()
                        .label("Content ID")
                        .required("Content ID is required."),
                    // Empty locator = an entry-level (unanchored) comment.
                    locator: fields.text().label("Locator"),
                    type: fields
                        .text()
                        .label("Type")
                        .required("Type is required.")
                        .predefinedValues(types),
                    resolved: fields.boolean().label("Resolved"),
                    resolvedBy: fields
                        .object()
                        .label("Resolved By")
                        .fields(identityFields => ({
                            id: identityFields.text().label("ID"),
                            displayName: identityFields.text().label("Display Name"),
                            type: identityFields.text().label("Type")
                        })),
                    resolvedOn: fields.datetime().label("Resolved On"),
                    assigneeId: fields.text().label("Assignee ID"),
                    dueDate: fields.datetime().label("Due Date"),
                    messages: fields
                        .object()
                        .label("Messages")
                        .list()
                        .fields(messageFields => ({
                            id: messageFields.text().label("ID").required("ID is required."),
                            body: messageFields.text().label("Body").required("Body is required."),
                            mentions: messageFields.text().label("Mentions").list(),
                            createdBy: messageFields
                                .object()
                                .label("Created By")
                                .fields(identityFields => ({
                                    id: identityFields
                                        .text()
                                        .label("ID")
                                        .required("ID is required."),
                                    displayName: identityFields
                                        .text()
                                        .label("Display Name")
                                        .required("Display name is required."),
                                    type: identityFields
                                        .text()
                                        .label("Type")
                                        .required("Type is required.")
                                })),
                            createdOn: messageFields
                                .datetime()
                                .label("Created On")
                                .required("Created on is required.")
                        }))
                }))
        ];
    }
}

export const CollabThreadModel = ModelFactory.createImplementation({
    implementation: CollabThreadModelImpl,
    dependencies: []
});
