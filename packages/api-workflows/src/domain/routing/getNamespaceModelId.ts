/**
 * The model id of a namespace, what a rule's `modelId` condition compares (R113): `cms.article`
 * gives `article`, `wb.page` gives `page`. Pure.
 */
export const getNamespaceModelId = (model: string): string => {
    const index = model.indexOf(".");
    return index === -1 ? model : model.slice(index + 1);
};
