import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";

export interface UserTargetReadCheck {
    userId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface UserFolderReadCheck {
    userId: string;
    model: string;
    folderId: string | null;
}

/** One user's read check through `filterReadableUsers`, the user named by id. */
export const canUserRead = async (
    access: ReviewTargetReadAccess.Interface,
    params: UserTargetReadCheck
): Promise<boolean> => {
    const readable = await access.filterReadableUsers({
        model: params.model,
        read: {
            type: "target",
            targetId: params.targetId,
            targetRevisionId: params.targetRevisionId
        },
        users: [{ id: params.userId, displayName: params.userId }]
    });
    return readable.includes(params.userId);
};

/** One user's folder read check through `filterReadableUsers` (R121). */
export const canUserReadInFolder = async (
    access: ReviewTargetReadAccess.Interface,
    params: UserFolderReadCheck
): Promise<boolean> => {
    const readable = await access.filterReadableUsers({
        model: params.model,
        read: { type: "folder", folderId: params.folderId },
        users: [{ id: params.userId, displayName: params.userId }]
    });
    return readable.includes(params.userId);
};
