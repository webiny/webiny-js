/**
 * The app of a namespace (D137): the prefix before the first `.`, e.g. `cms` for `cms.article`
 * and `wb` for `wb.page`. Least loaded counts load per app. Pure.
 */
export const getNamespaceApp = (model: string): string => {
    const index = model.indexOf(".");
    return index === -1 ? model : model.slice(0, index);
};
