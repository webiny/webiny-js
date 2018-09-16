// @flow
import { createSelector } from "reselect";
import { selectUi } from "webiny-app/redux";

export const selectTheme = createSelector(selectUi, ui => {
    return ui.theme || {};
});
