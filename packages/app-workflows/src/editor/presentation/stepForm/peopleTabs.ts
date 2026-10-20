/*
 * The ids of the People step form's layout parts (R293, R302): the tabs node and its three tabs.
 * The drawer and the tests address a tab by these; `activeTabId` of the tabs node is one of them.
 */
export const PEOPLE_TABS_ID = "peopleTabs";

export const PEOPLE_TAB = {
    general: "general",
    assignment: "assignment",
    testRouting: "testRouting"
} as const;
