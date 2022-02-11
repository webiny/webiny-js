import { useParams } from "@webiny/react-router";

export const useCurrentChangeRequestId = (): string | null => {
    const { changeRequestId } = useParams() as { changeRequestId: string };
    return changeRequestId ? decodeURIComponent(changeRequestId) : null;
};
