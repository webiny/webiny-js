import type { NonEmptyArray } from "@webiny/api/types.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION } from "~/domain/notifications/constants.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import type { WorkflowNotificationWebsocketData } from "~/domain/notifications/types.js";
import { NotificationTransport } from "~/features/notifications/NotificationTransport/abstractions.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/abstractions.js";
import { ReviewTargetLinkService } from "~/features/notifications/ReviewTargetLinkService/abstractions.js";
import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/abstractions.js";
import { ReviewNotifierService as Abstraction } from "./abstractions.js";

const WEBSOCKET_TEXT = "Could not send a workflow websocket notification.";
const LOOKUP_TEXT = "Could not look up the users to e-mail.";
const TRANSPORT_TEXT = "Could not send a workflow notification through a transport.";
const UNKNOWN_TRANSPORT_TEXT = "A step names a notification transport that is not registered.";

class ReviewNotifierServiceImpl implements Abstraction.Interface {
    public constructor(
        private websocketSender: ReviewWebsocketSender.Interface,
        private transports: NotificationTransport.Interface[],
        private recipientService: NotificationRecipientService.Interface,
        private linkService: ReviewTargetLinkService.Interface,
        private logger: Logger.Interface
    ) {}

    public async notify(params: Abstraction.Params): Promise<void> {
        const { review, stepId, event, message } = params;

        // One entry per id, the first wins (a pool list cannot hold a person twice, but a custom
        // handler might).
        const recipients = [...new Map(params.recipients.map(item => [item.id, item])).values()];
        if (recipients.length === 0) {
            return;
        }

        // ---- Websocket (R187, R188, R197, R255) ------------------------------------------------
        // The sender removes duplicate and empty ids (`identityId: ""` would list every
        // connection), keeps to the connections of the current tenant, sends in batches and
        // never rejects.
        const data: WorkflowNotificationWebsocketData = {
            event,
            reviewId: review.id,
            stepId,
            namespace: review.model,
            targetId: review.targetId,
            targetRevisionId: review.targetRevisionId,
            title: message.title,
            body: message.body
        };
        const recipientIds = recipients.map(item => item.id);
        // The sender never rejects; this catch only guards a decorator that does (R87), so the
        // transports below still run.
        try {
            await this.websocketSender.send({
                reviewId: review.id,
                event,
                recipientIds,
                action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
                data
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event },
                WEBSOCKET_TEXT
            );
        }

        // ---- Transports (R186, R192, R193, R194, R195) -----------------------------------------
        try {
            const step =
                stepId === null ? undefined : review.steps.find(item => item.id === stepId);
            if (!step || (step.notifications ?? []).length === 0) {
                return;
            }

            // The last registered transport per id wins (override semantics, so the Map keeps the last
            // one); ids are visited in the step's own order, one call per id.
            const registered = new Map(this.transports.map(item => [item.id, item]));
            const selected: NotificationTransport.Interface[] = [];
            for (const transportId of new Set((step.notifications ?? []).map(item => item.id))) {
                const transport = registered.get(transportId);
                if (!transport) {
                    this.logger.error(
                        { reviewId: review.id, stepId: step.id, transportId },
                        UNKNOWN_TRANSPORT_TEXT
                    );
                    continue;
                }
                selected.push(transport);
            }
            if (selected.length === 0) {
                return;
            }

            // The recipient service wraps every lookup error: the message may embed addresses, so
            // only the code and the name are logged (R196).
            let found: Awaited<NotificationRecipientService.UsersReturn>;
            try {
                found = await this.recipientService.listUsers(recipients.map(item => item.id));
            } catch (error) {
                this.logger.error(
                    { ...getErrorLogFields(error), reviewId: review.id, event },
                    LOOKUP_TEXT
                );
                return;
            }
            if (found.isFail()) {
                this.logger.error(
                    { ...getErrorLogFields(found.error), reviewId: review.id, event },
                    LOOKUP_TEXT
                );
                return;
            }
            const [firstUser, ...otherUsers] = found.value;
            if (!firstUser) {
                return;
            }
            const users: NonEmptyArray<NotificationTransport.User> = [firstUser, ...otherUsers];

            // `null` means the mail goes without a link. The link service logs its own problems.
            const url = await this.linkService.getUrl({
                model: review.model,
                targetId: review.targetId,
                targetRevisionId: review.targetRevisionId
            });
            const transportMessage: NotificationTransport.Message = {
                title: message.subject,
                body: message.text,
                url,
                linkLabel: message.linkLabel
            };

            for (const transport of selected) {
                try {
                    await transport.send({ users, message: transportMessage });
                } catch (error) {
                    // A third-party transport may put anything in its message: code and name only.
                    this.logger.error(
                        {
                            ...getErrorLogFields(error),
                            transportId: transport.id,
                            reviewId: review.id,
                            event
                        },
                        TRANSPORT_TEXT
                    );
                }
            }
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event },
                TRANSPORT_TEXT
            );
        }
    }
}

export const ReviewNotifierService = Abstraction.createImplementation({
    implementation: ReviewNotifierServiceImpl,
    dependencies: [
        ReviewWebsocketSender,
        [NotificationTransport, { multiple: true }],
        NotificationRecipientService,
        ReviewTargetLinkService,
        Logger
    ]
});
