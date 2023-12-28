import { useRouter } from "@webiny/react-router";

interface UseContentReviewIdResult {
    encodedId: string;
    id: string;
}

export const useContentReviewId = (): UseContentReviewIdResult | null => {
    const { params } = useRouter();
    const { contentReviewId } = params as { contentReviewId: string | undefined };

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
    const { params } = useRouter();
    const { stepId } = params as { stepId: string };

    return {
        id: decodeURIComponent(stepId),
        encodedId: encodeURIComponent(stepId)
    };
};

export const useActiveStepId = (): string => {
    const { location } = useRouter();
    /**
     * Get active "stepId" from pathname.
     * Where pathname will be "/apw/content-reviews/:contentReviewId/:stepId/:changeRequestId"
     */
    const tokens = location.pathname.split("/").filter(token => token.length !== 0);
    return encodeURIComponent(tokens[3]);
};
