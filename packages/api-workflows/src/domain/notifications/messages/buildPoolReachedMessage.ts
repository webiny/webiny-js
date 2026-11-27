import type { NotificationMessage } from "~/domain/notifications/types.js";
import { STEP_REVIEWER_FOOTER } from "~/domain/notifications/messages/notificationFooters.js";

export interface PoolReachedMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** `review.createdBy.displayName`. */
    requester: string;
    /**
     * The recipients' team names, already joined by `joinTeamNames` ("Legal and Marketing"), or
     * `null` when they are not known: the text then says "the team pool".
     */
    teamNames: string | null;
}

/** A step reached the team pool (R189, `poolReached`). */
export const buildPoolReachedMessage = (params: PoolReachedMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, requester, teamNames } = params;
    const pool =
        teamNames === null || teamNames === "" ? "the team pool" : `the ${teamNames} team pool`;
    return {
        title: `“${contentTitle}” is waiting in ${pool}`,
        body: `${stepTitle} · requested by ${requester}`,
        subject: `Team pool: ${contentTitle} (${stepTitle})`,
        text: `“${stepTitle}” is waiting in ${pool}. Anyone in the team can start it.`,
        linkLabel: "Open content",
        link: "content",
        footer: STEP_REVIEWER_FOOTER
    };
};
