const minWidthRegExp = new RegExp("min-width:[ ]*([0-9a-z]*)");
const maxWidthRegExp = new RegExp("max-width:[ ]*([0-9a-z]*)");

/**
 * At the moment, we only support basic transformations (check tests).
 * If this won't be good enoough, we can potentially check this
 * library: https://www.npmjs.com/package/media-query-parser
 */
export const mediaToContainer = (mediaQuery: string): string => {
    const [, minWidth] = mediaQuery.match(minWidthRegExp) || [];
    const [, maxWidth] = mediaQuery.match(maxWidthRegExp) || [];

    const widthRules = [
        minWidth && `(min-width: ${minWidth})`,
        maxWidth && `(max-width: ${maxWidth})`
    ]
        .filter(Boolean)
        .join(" and ");

    return `@container page-canvas ${widthRules}`;
};
