export const CMS_NAMESPACE = "Cms/Entry/";

export const createNamespace = (modelId: string) => {
    return `${CMS_NAMESPACE}${modelId}`;
};

export const extractModelIdFromNamespace = (namespace: string): string | null => {
    if (!namespace.startsWith(CMS_NAMESPACE)) {
        return null;
    }
    return namespace.substring(CMS_NAMESPACE.length);
};
