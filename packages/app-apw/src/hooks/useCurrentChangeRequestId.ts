import { useParams, useLocation } from "@webiny/react-router";

export const useCurrentChangeRequestId = (): string | null => {
    const { changeRequestId } = useParams() as { changeRequestId: string };
    return changeRequestId ? decodeURIComponent(changeRequestId) : null;
};

export const useActiveChangeRequestId = (): string => {
    const location = useLocation();
    /**
     * Get active "changeRequestId" from pathname.
     */
    const tokens = location.pathname.split("/");
    return encodeURIComponent(tokens[tokens.length - 1]);
};
