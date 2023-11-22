export interface CreateEntryUrlParams {
    id: string;
    modelId: string;
    folderId?: string;
}

export const createEntryUrl = ({ modelId, id, folderId }: CreateEntryUrlParams): string => {
    const query = [
        `id=${encodeURIComponent(id)}`,
        folderId && `folderId=${encodeURIComponent(folderId)}`
    ]
        .filter(Boolean)
        .join("&");

    return `/cms/content-entries/${modelId}?${query}`;
};

export const createNewEntryUrl = (modelId: string): string => {
    return `/cms/content-entries/${modelId}?new=true`;
};
