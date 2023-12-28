import { useRouter } from "@webiny/react-router";

export const useCurrentChangeRequestId = (): string | null => {
    const { params } = useRouter();
    const { changeRequestId } = params as { changeRequestId: string };
    return changeRequestId ? decodeURIComponent(changeRequestId) : null;
};

export const useActiveChangeRequestId = (): string => {
    const { location } = useRouter();
    /**
     * Get active "changeRequestId" from pathname.
     */
    const tokens = location.pathname.split("/");
    return encodeURIComponent(tokens[tokens.length - 1]);
};
