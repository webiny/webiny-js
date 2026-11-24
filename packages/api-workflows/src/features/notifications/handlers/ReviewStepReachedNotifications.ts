import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { groupPoolRecipients } from "~/domain/notifications/groupPoolRecipients.js";
import { joinTeamNames } from "~/domain/notifications/joinTeamNames.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { buildAssignedMessage } from "~/domain/notifications/messages/buildAssignedMessage.js";
import { buildPoolReachedMessage } from "~/domain/notifications/messages/buildPoolReachedMessage.js";
import { getAssignmentReason } from "~/domain/notifications/messages/getAssignmentReason.js";
import { ReviewStepReachedEventHandler } from "~/features/review/ReviewStepReacher/events.js";
import { NotificationRecipientService } from "~/features/notifications/NotificationRecipientService/abstractions.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";
import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";

/**
 * Tells the owner of a reached step that it is theirs, or the pool that a step is waiting (R181,
 * R183). AI and automation owners are never told (D58). Catches everything (R182, R87).
 */
class ReviewStepReachedNotificationsImpl implements ReviewStepReachedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private recipients: NotificationRecipientService.Interface,
        private listCandidateTeams: ListReviewCandidateTeamsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepReachedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            if (fact.owner && fact.owner.type !== "user") {
                return;
            }

            const step = review.steps.find(item => item.id === fact.change.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.change.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            if (fact.owner) {
                const recipients = dropActor(
                    [{ id: fact.owner.id, displayName: fact.owner.displayName }],
                    fact.actor
                );
                if (recipients.length === 0) {
                    return;
                }
                await this.notifier.notify({
                    review,
                    stepId: step.id,
                    event: "assigned",
                    deliveries: [
                        {
                            recipients,
                            message: buildAssignedMessage({
                                contentTitle: review.title,
                                stepTitle: step.title,
                                reason: getAssignmentReason(
                                    fact.assignment?.source,
                                    getActorName(review.createdBy, step.title)
                                ),
                                reassignedBy: null
                            })
                        }
                    ]
                });
                return;
            }

            const pool = await this.recipients.listPool({
                review,
                stepId: step.id,
                now: new Date(fact.occurredOn)
            });
            if (pool.isFail()) {
                // The recipient service wraps every lookup error: code and name only (R196).
                this.logger.error(
                    {
                        ...getErrorLogFields(pool.error),
                        reviewId: review.id,
                        stepId: step.id
                    },
                    "Could not list the members of the step's teams."
                );
                return;
            }
            const recipients = dropActor(pool.value, fact.actor);
            if (recipients.length === 0) {
                return;
            }

            // One lookup for the names of the step's candidate teams. Without names (a failed
            // lookup, which the use case logs, or deleted teams) the text says "the team pool".
            const teamNames = new Map<string, string>();
            try {
                const teams = await this.listCandidateTeams.execute({
                    teamIds: step.candidateTeamIds
                });
                if (teams.isOk()) {
                    for (const team of teams.value) {
                        teamNames.set(team.id, team.name);
                    }
                }
            } catch (error) {
                this.logger.error(
                    { ...getErrorLogFields(error), reviewId: review.id, stepId: step.id },
                    "Could not look up the names of the step's teams."
                );
            }

            // One message per distinct text (D158 follow-up): recipients are grouped by their
            // team set, and sets whose names read the same (unknown teams left out) share one.
            const requester = getActorName(review.createdBy, step.title);
            const byNames = new Map<string, ReviewNotifierService.Delivery>();
            for (const group of groupPoolRecipients(recipients)) {
                const names = joinTeamNames(
                    group.teamIds.flatMap(teamId => {
                        const name = teamNames.get(teamId);
                        return name ? [name] : [];
                    })
                );
                const groupRecipients = group.recipients.map(item => {
                    return { id: item.id, displayName: item.displayName };
                });
                const existing = byNames.get(names);
                if (existing) {
                    existing.recipients.push(...groupRecipients);
                    continue;
                }
                byNames.set(names, {
                    recipients: groupRecipients,
                    message: buildPoolReachedMessage({
                        contentTitle: review.title,
                        stepTitle: step.title,
                        requester,
                        teamNames: names === "" ? null : names
                    })
                });
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "poolReached",
                deliveries: [...byNames.values()]
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepReachedNotifications = ReviewStepReachedEventHandler.createImplementation({
    implementation: ReviewStepReachedNotificationsImpl,
    dependencies: [
        ReviewNotifierService,
        NotificationRecipientService,
        ListReviewCandidateTeamsUseCase,
        Logger
    ]
});
