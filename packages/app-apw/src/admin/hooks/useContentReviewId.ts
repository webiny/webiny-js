import { useParams, useRouter } from "@webiny/react-router";

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
    id: string;
    encodedId: string;
}

export const useCurrentStepId = (): UseCurrentStepIdResult => {
    const { stepId } = useParams() as { stepId: string };
    return {
        id: decodeURIComponent(stepId),
        encodedId: stepId
    };
};

export const useActiveStepId = (): string => {
    const { location } = useRouter();
    /**
     * Get active "stepId" from pathname.
     * Where pathname will be "/apw/content-reviews/:contentReviewId/:stepId/:changeRequestId"
     */
    const tokens = location.pathname.split("/").filter(token => token.length !== 0);
    return tokens[3];
};
