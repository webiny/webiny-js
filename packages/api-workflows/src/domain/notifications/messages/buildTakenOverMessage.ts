import type { NotificationMessage } from "~/domain/notifications/types.js";

export interface TakenOverMessageParams {
    /** `review.title`. */
    contentTitle: string;
    stepTitle: string;
    /** Who took the step over (`getActorName`). */
    taker: string;
}

/** The previous owner of a step somebody took over (D111, R189, `takenOver`). */
export const buildTakenOverMessage = (params: TakenOverMessageParams): NotificationMessage => {
    const { contentTitle, stepTitle, taker } = params;
    return {
        title: `${taker} took over ${stepTitle} on “${contentTitle}”.`,
        body: "You no longer own this step.",
        subject: `Taken over: ${contentTitle} (${stepTitle})`,
        text: `${taker} took over ${stepTitle} on “${contentTitle}”. You don’t need to review it any more.`,
        linkLabel: "Open content"
    };
};
