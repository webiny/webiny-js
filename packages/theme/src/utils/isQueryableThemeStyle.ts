/*
 * List of theme styles that implemented the new queryable object structure.
 *
 * Note: When all styles like 'colors' will implement the new structure in future
 * this list will no longer need.
 */
const queryableThemeStylesKeys = ["typography"];

/*
* Checks if legacy style object structure can be converted to new queryable style
* */
export const isQueryableThemeStyle = (themeStyleKey: string) => {
    return queryableThemeStylesKeys.includes(themeStyleKey);
}
