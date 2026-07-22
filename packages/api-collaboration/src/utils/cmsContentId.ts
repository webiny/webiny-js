/**
 * For `cms.entry` content, the collaboration core's opaque `contentId` encodes both the model
 * and the (revision-independent) entry id as `"<modelId>:<entryId>"`. The admin client always
 * knows both when creating a thread, and the CMS resolver parses it here. This keeps the core
 * content-agnostic (it never learns what a "model" is).
 */
export const formatCmsContentId = (modelId: string, entryId: string): string => {
    return `${modelId}:${entryId}`;
};

export interface ParsedCmsContentId {
    modelId: string | null;
    entryId: string | null;
}

export const parseCmsContentId = (contentId: string): ParsedCmsContentId => {
    const separatorIndex = contentId.indexOf(":");
    if (separatorIndex === -1) {
        return { modelId: null, entryId: null };
    }

    const modelId = contentId.slice(0, separatorIndex);
    const entryId = contentId.slice(separatorIndex + 1);

    if (!modelId || !entryId) {
        return { modelId: null, entryId: null };
    }

    return { modelId, entryId };
};
