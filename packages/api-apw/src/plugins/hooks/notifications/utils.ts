import { ApwReviewer, ApwWorkflowStep } from "~/types";

interface GetReviewerListParams {
    steps: ApwWorkflowStep[];
}

interface GetReviewerList {
    (params: GetReviewerListParams): Record<string, ApwReviewer>;
}
export const getReviewers: GetReviewerList = ({ steps }) => {
    return steps.reduce<Record<string, ApwReviewer>>((collection, step) => {
        for (const reviewer of step.reviewers) {
            /**
             * We do not need users which have no e-mail in their data.
             */
            if (!reviewer.email) {
                continue;
            }
            collection[reviewer.entryId] = reviewer;
        }

        return collection;
    }, {});
};
