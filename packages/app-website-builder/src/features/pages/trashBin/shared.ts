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
    deletedBy {
        id
        displayName
        type
    }
    deletedOn
`;

export interface TrashPageDto {
    id: string;
    entryId: string;
    properties: { title: string };
    location: { folderId: string | undefined };
    createdBy: { id: string; displayName: string; type: string };
    deletedBy: { id: string; displayName: string; type: string } | null;
    deletedOn: string | null;
}

export function toTrashBinItem(page: TrashPageDto): TrashBinItem {
    return {
        id: page.entryId,
        title: page.properties.title,
        location: page.location,
        createdBy: page.createdBy,
        deletedBy: {
            id: page.deletedBy?.id || "",
            displayName: page.deletedBy?.displayName || "",
            type: page.deletedBy?.type || ""
        },
        deletedOn: page.deletedOn || ""
    };
}
