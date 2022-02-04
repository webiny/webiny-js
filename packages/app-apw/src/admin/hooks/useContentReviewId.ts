import { useRouter } from "@webiny/react-router";

interface MatchQuery {
    contentReviewId: string;
}

interface UseContentReviewIdResult {
    encodedId: string;
    id: string;
}

export const useContentReviewId = (): UseContentReviewIdResult => {
    const { match } = useRouter();
    const { contentReviewId } = match.params as MatchQuery;
    return {
        id: decodeURIComponent(contentReviewId),
        encodedId: contentReviewId
    };
};

interface UseCurrentStepIdResult {
    stepId: string;
    changeRequestId: string;
}

export const useCurrentStepId = (): UseCurrentStepIdResult => {
    const { location } = useRouter();
    const query = new URLSearchParams(location.search);
    return {
        stepId: query.get("stepId"),
        changeRequestId: query.get("changeRequestId")
    };
};
