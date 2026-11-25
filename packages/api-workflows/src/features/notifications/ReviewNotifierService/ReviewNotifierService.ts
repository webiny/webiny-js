import type { NonEmptyArray } from "@webiny/api/types.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION } from "~/features/notifications/shared/constants.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import type { WorkflowNotificationWebsocketData } from "~/domain/notifications/types.js";
import { getNotificationDetails } from "~/domain/notifications/getNotificationDetails.js";
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
        const { review, stepId, event } = params;

        // One entry per id within a delivery, the first wins (a pool list cannot hold a person
        // twice, but a custom handler might). A delivery with nobody left is dropped.
        const deliveries: Abstraction.Delivery[] = [];
        for (const delivery of params.deliveries) {
            const recipients = [
                ...new Map(delivery.recipients.map(item => [item.id, item])).values()
            ];
            if (recipients.length > 0) {
                deliveries.push({ recipients, message: delivery.message });
            }
        }
        if (deliveries.length === 0) {
            return;
        }

        // ---- Websocket (R187, R188, R197, R255) ------------------------------------------------
        // The sender removes duplicate and empty ids (`identityId: ""` would list every
        // connection), keeps to the connections of the current tenant, sends in batches and
        // never rejects. One send per delivery: each has its own text.
        for (const delivery of deliveries) {
            const data: WorkflowNotificationWebsocketData = {
                event,
                reviewId: review.id,
                stepId,
                namespace: review.model,
                targetId: review.targetId,
                targetRevisionId: review.targetRevisionId,
                title: delivery.message.title,
                body: delivery.message.body
            };
            // The sender never rejects; this catch only guards a decorator that does (R87), so
            // the other deliveries and the transports below still run.
            try {
                // oxlint-disable-next-line no-await-in-loop -- one send per distinct text, a handful at most.
                await this.websocketSender.send({
                    reviewId: review.id,
                    event,
                    recipientIds: delivery.recipients.map(item => item.id),
                    action: WORKFLOWS_NOTIFICATION_WEBSOCKET_ACTION,
                    data
                });
            } catch (error) {
                this.logger.error(
                    { ...getErrorLogFields(error), reviewId: review.id, event },
                    WEBSOCKET_TEXT
                );
            }
        }

        // ---- Transports (R186, R192, R193, R194, R195) -----------------------------------------
        try {
            const step =
                stepId === null ? undefined : review.steps.find(item => item.id === stepId);
            if (!step || (step.notifications ?? []).length === 0) {
                return;
            }

            // The last registered transport per id wins (override semantics, so the Map keeps the last
            // one); ids are visited in the step's own order, one call per id and delivery.
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

            // One lookup for the people of every delivery. The recipient service wraps every
            // lookup error: the message may embed addresses, so only the code and the name are
            // logged (R196).
            const recipientIds = [
                ...new Set(deliveries.flatMap(delivery => delivery.recipients.map(item => item.id)))
            ];
            let found: Awaited<NotificationRecipientService.UsersReturn>;
            try {
                found = await this.recipientService.listUsers(recipientIds);
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
            const usersById = new Map(found.value.map(user => [user.id, user]));
            if (usersById.size === 0) {
                return;
            }

            // At most one URL per link kind. `null` means the mail goes without a link. The link
            // service logs its own problems.
            const target = {
                model: review.model,
                targetId: review.targetId,
                targetRevisionId: review.targetRevisionId
            };
            const contentUrl = deliveries.some(item => item.message.link === "content")
                ? await this.linkService.getUrl(target)
                : null;
            const reviewDetailsUrl = deliveries.some(item => item.message.link === "reviewDetails")
                ? await this.linkService.getUrl({ ...target, reviewId: review.id })
                : null;
            const details = getNotificationDetails(review, step.id);

            for (const delivery of deliveries) {
                const [firstUser, ...otherUsers] = delivery.recipients.flatMap(item => {
                    const user = usersById.get(item.id);
                    return user ? [user] : [];
                });
                if (!firstUser) {
                    continue;
                }
                const users: NonEmptyArray<NotificationTransport.User> = [firstUser, ...otherUsers];
                const { message } = delivery;
                const transportMessage: NotificationTransport.Message = {
                    title: message.subject,
                    body: message.text,
                    url: message.link === "reviewDetails" ? reviewDetailsUrl : contentUrl,
                    linkLabel: message.linkLabel,
                    footer: message.footer
                };
                if (details) {
                    transportMessage.details = { ...details };
                }

                for (const transport of selected) {
                    try {
                        // oxlint-disable-next-line no-await-in-loop -- one send per selected transport and delivery, a handful at most.
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
