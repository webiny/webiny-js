import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { NotificationType } from "./abstractions.js";
import { NOTIFICATION_MODEL_ID } from "~/constants.js";

const types = [
    { label: "Mention", value: NotificationType.mention },
    { label: "Reply", value: NotificationType.reply },
    { label: "Review requested", value: NotificationType.reviewRequested },
    { label: "Approved", value: NotificationType.approved },
    { label: "Rejected", value: NotificationType.rejected }
];

class NotificationModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: NOTIFICATION_MODEL_ID,
                    name: "Notification"
                })
                .fields(fields => ({
                    recipientId: fields
                        .text()
                        .label("Recipient ID")
                        .required("Recipient ID is required."),
                    type: fields
                        .text()
                        .label("Type")
                        .required("Type is required.")
                        .predefinedValues(types),
                    actor: fields
                        .object()
                        .label("Actor")
                        .fields(actorFields => ({
                            id: actorFields.text().label("ID").required("ID is required."),
                            displayName: actorFields.text().label("Display Name"),
                            type: actorFields.text().label("Type")
                        })),
                    title: fields.text().label("Title"),
                    snippet: fields.text().label("Snippet"),
                    link: fields.json().label("Link"),
                    read: fields.boolean().label("Read"),
                    readOn: fields.text().label("Read On"),
                    archived: fields.boolean().label("Archived"),
                    archivedOn: fields.text().label("Archived On")
                }))
        ];
    }
}

export const NotificationModel = ModelFactory.createImplementation({
    implementation: NotificationModelImpl,
    dependencies: []
});
