/*
 * The admin-ui list keeps the last empty message it was given when a prop turns `undefined`, so
 * with no search text this returns the library's own default text ("No results.") explicitly.
 */
export const getPickerEmptyMessage = (query: string): string => {
    if (query === "") {
        return "No results.";
    }
    return `Nothing matches “${query}”.`;
};
