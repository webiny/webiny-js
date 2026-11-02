const CMS_FOLDER_TYPE = /^cms:([a-zA-Z0-9_-]+)$/;

/** The ACO folder type of a CMS model's entries, e.g. "cms:article". Pure. */
export const toCmsFolderType = (modelId: string): string => {
    return `cms:${modelId}`;
};

/** The model id of a `cms:<modelId>` folder type; `null` for any other type (e.g. "wb:page"). */
export const getModelIdFromFolderType = (type: string): string | null => {
    const matched = type.match(CMS_FOLDER_TYPE);
    return matched ? matched[1] : null;
};
