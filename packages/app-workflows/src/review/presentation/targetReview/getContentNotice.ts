import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewContentNoticeVm } from "./abstractions.js";

/*
 * The "Content updated by {step}" notice (R262, QBZ-56): `auto_awesome` for an AI owner, `bolt`
 * for an automation. Pure.
 */
export const getContentNotice = (step: ReviewStep): ReviewContentNoticeVm => {
    const text = `Content updated by ${step.title}. The editor loaded the latest version.`;
    if (step.owner !== null && step.owner.type === "ai") {
        return { text, icon: "auto_awesome" };
    }
    return { text, icon: "bolt" };
};
