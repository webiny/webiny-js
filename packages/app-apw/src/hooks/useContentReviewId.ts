import { useParams, useLocation } from "@webiny/react-router";

interface UseContentReviewIdResult {
    encodedId: string;
    id: string;
}

export const useContentReviewId = (): UseContentReviewIdResult | null => {
    const { contentReviewId } = useParams();
    if (!contentReviewId) {
        return null;
    }
    return {
        id: decodeURIComponent(contentReviewId),
        encodedId: encodeURIComponent(contentReviewId)
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
        encodedId: encodeURIComponent(stepId)
    };
};

export const useActiveStepId = (): string => {
    const location = useLocation();
    /**
     * Get active "stepId" from pathname.
     * Where pathname will be "/apw/content-reviews/:contentReviewId/:stepId/:changeRequestId"
     */
    const tokens = location.pathname.split("/").filter(token => token.length !== 0);
    return encodeURIComponent(tokens[3]);
};
