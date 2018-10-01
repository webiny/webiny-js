// @flow
import { createAction, dispatch, selectUi, addMiddleware, addReducer } from "webiny-app/redux";
import { createSelector } from "reselect";
import _ from "lodash";
import { default as localStorage } from "store";

const PREFIX = "[ADMIN_MENU]";
const LOCAL_STORAGE_KEY = "webiny_apps_menu_sections";

export const SHOW_MENU = `${PREFIX} Show`;
export const HIDE_MENU = `${PREFIX} Hide`;
export const TOGGLE_MENU = `${PREFIX} Toggle`;
export const CHOOSE_INITIALLY_EXPANDED_SECTIONS = `${PREFIX} Choose Initially Expanded Sections`;
export const SHOW_APPS_MENU_SECTION = `${PREFIX} Show Section`;
export const HIDE_APPS_MENU_SECTION = `${PREFIX} Hide Section`;

export const selectAppsMenu = createSelector(selectUi, ui => ui.appsMenu || {});
export const selectAppsMenuShow = createSelector(selectAppsMenu, appsMenu => !!appsMenu.show);

export const showMenu = createAction(SHOW_MENU);
addReducer([SHOW_MENU], "ui.appsMenu.show", () => true);

export const hideMenu = createAction(HIDE_MENU);
addReducer([HIDE_MENU], "ui.appsMenu.show", () => false);

export const toggleMenu = createAction(TOGGLE_MENU, {
    slice: "ui.appsMenu.show",
    reducer: ({ state }) => !state
});
addReducer([TOGGLE_MENU], "ui.appsMenu.show", state => !state);

const modifyExpandedSections = (
    expandedSections: Array<string>,
    ids: Array<string>,
    action: string
) => {
    const returnIds = _.clone(expandedSections);
    ids.forEach(id => {
        if (action === "expand") {
            !returnIds.includes(id) && returnIds.push(id);
        } else {
            returnIds.includes(id) && returnIds.splice(returnIds.indexOf(id), 1);
        }
    });

    return returnIds;
};

export const expandAppsMenuSection = createAction(SHOW_APPS_MENU_SECTION);
addReducer([SHOW_APPS_MENU_SECTION], "ui.appsMenu", (state, action) => {
    let { id: ids } = action.payload;
    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    let expandedSections = _.get(state, "expandedSections", []);
    expandedSections = modifyExpandedSections(expandedSections, ids, "expand");

    return { ...state, expandedSections };
});
addMiddleware([SHOW_APPS_MENU_SECTION], ({ store, action, next }) => {
    next(action);
    let { id: ids } = action.payload;
    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    let expandedSections = _.get(store.getState(), "ui.appsMenu.expandedSections", []);
    expandedSections = modifyExpandedSections(expandedSections, ids, "expand");

    // Set the value into local storage, so that when we refresh the site, we still have the same sections expanded.
    localStorage.set(LOCAL_STORAGE_KEY, expandedSections.join(","));
});

export const collapseAppsMenuSection = createAction(HIDE_APPS_MENU_SECTION);
addReducer([HIDE_APPS_MENU_SECTION], "ui.appsMenu", (state, action) => {
    let { id: ids } = action.payload;
    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    let expandedSections = _.get(state, "expandedSections", []);
    expandedSections = modifyExpandedSections(expandedSections, ids, "collapse");

    return { ...state, expandedSections };
});
addMiddleware([HIDE_APPS_MENU_SECTION], ({ store, action, next }) => {
    next(action);
    let { id: ids } = action.payload;
    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    let expandedSections = _.get(store.getState(), "ui.appsMenu.expandedSections", []);
    expandedSections = modifyExpandedSections(expandedSections, ids, "collapse");

    // Set the value into local storage, so that when we refresh the site, we still have the same sections expanded.
    localStorage.set(LOCAL_STORAGE_KEY, expandedSections.join(","));
});

export const initSections = createAction(CHOOSE_INITIALLY_EXPANDED_SECTIONS);
addMiddleware([CHOOSE_INITIALLY_EXPANDED_SECTIONS], ({ next, action }) => {
    next(action);
    if (localStorage.get(LOCAL_STORAGE_KEY)) {
        dispatch(expandAppsMenuSection({ id: localStorage.get(LOCAL_STORAGE_KEY).split(",") }));
    }
});
