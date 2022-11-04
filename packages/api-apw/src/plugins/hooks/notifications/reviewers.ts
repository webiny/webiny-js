import { ApwContext, ApwReviewerWithEmail, ApwWorkflow, ApwWorkflowStep } from "~/types";

interface GetReviewerIdListParams {
    steps: ApwWorkflowStep[];
}
interface GetReviewerIdList {
    (params: GetReviewerIdListParams): string[];
}
export const getReviewerIdList: GetReviewerIdList = ({ steps }) => {
    return steps.reduce<string[]>((collection, step) => {
        for (const reviewer of step.reviewers) {
            collection.push(reviewer.id);
        }

        return collection;
    }, []);
};

interface FetchReviewersParams {
    context: ApwContext;
    workflow: ApwWorkflow;
}
export const fetchReviewers = async (
    params: FetchReviewersParams
): Promise<ApwReviewerWithEmail[]> => {
    const { context, workflow } = params;

    const idList = getReviewerIdList(workflow);

    const [reviewers] = await context.apw.reviewer.list({
        where: {
            id_in: idList
        },
        limit: 10000
    });
    return reviewers.filter(item => !!item.email) as ApwReviewerWithEmail[];
};
