import type { TrashBinItem } from "@webiny/app-admin/presentation/trashBin/abstractions.js";

export const TRASH_PAGE_FIELDS = `
    id
    entryId
    properties
    location {
        folderId
    }
    createdBy {
        id
        displayName
        type
    }
    modifiedBy {
        id
        displayName
        type
    }
    modifiedOn
`;

export interface TrashPageDto {
    id: string;
    entryId: string;
    properties: { title: string };
    location: { folderId: string | undefined };
    createdBy: { id: string; displayName: string; type: string };
    modifiedBy: { id: string; displayName: string; type: string } | null;
    modifiedOn: string | null;
}

export function toTrashBinItem(page: TrashPageDto): TrashBinItem {
    return {
        id: page.entryId,
        title: page.properties.title,
        location: page.location,
        createdBy: page.createdBy,
        deletedBy: {
            id: page.modifiedBy?.id || "",
            displayName: page.modifiedBy?.displayName || "",
            type: page.modifiedBy?.type || ""
        },
        deletedOn: page.modifiedOn || ""
    };
}
