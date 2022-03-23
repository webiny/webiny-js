import Error from "@webiny/error";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ApwContentReviewStep, ApwWorkflowStepTypes } from "~/types";

dayjs.extend(utc);

export function checkValidDateTime(datetime: string | undefined): void {
    if (typeof datetime !== "string") {
        return;
    }

    if (!dayjs(datetime).isValid()) {
        throw new Error({
            message: `Invalid input "datetime" should be an ISO string.`,
            code: "INVALID_DATETIME_FORMAT",
            data: {
                datetime
            }
        });
    }
    const today = dayjs.utc();

    if (dayjs(datetime).isBefore(today)) {
        throw new Error({
            message: `Cannot schedule for a past "datetime".`,
            code: "PAST_DATETIME",
            data: {
                datetime
            }
        });
    }
}

export interface GetPendingRequiredSteps {
    (
        steps: ApwContentReviewStep[],
        predicate: (step: ApwContentReviewStep) => boolean
    ): ApwContentReviewStep[];
}

export const getPendingRequiredSteps: GetPendingRequiredSteps = (steps, predicate) => {
    return steps.filter(step => {
        const isRequiredStep = [
            ApwWorkflowStepTypes.MANDATORY_BLOCKING,
            ApwWorkflowStepTypes.MANDATORY_NON_BLOCKING
        ].includes(step.type);

        if (!isRequiredStep) {
            return false;
        }

        return predicate(step);
    });
};
