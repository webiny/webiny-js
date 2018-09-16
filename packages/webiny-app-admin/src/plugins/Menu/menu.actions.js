// @flow
import { createAction, dispatch, selectUi } from "webiny-app/redux";
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

export const showMenu = createAction(SHOW_MENU, {
    slice: "ui.appsMenu.show",
    reducer: () => true
});

export const hideMenu = createAction(HIDE_MENU, {
    slice: "ui.appsMenu.show",
    reducer: () => false
});

export const toggleMenu = createAction(TOGGLE_MENU, {
    slice: "ui.appsMenu.show",
    reducer: ({ state }) => !state
});

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

export const expandAppsMenuSection = createAction(SHOW_APPS_MENU_SECTION, {
    slice: "ui.appsMenu",
    reducer: ({ action, state }) => {
        let { id: ids } = action.payload;
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        let expandedSections = _.get(state, "expandedSections", []);
        expandedSections = modifyExpandedSections(expandedSections, ids, "expand");

        return { ...state, expandedSections };
    },
    middleware: ({ store, action, next }) => {
        next(action);
        let { id: ids } = action.payload;
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        let expandedSections = _.get(store.getState(), "ui.appsMenu.expandedSections", []);
        expandedSections = modifyExpandedSections(expandedSections, ids, "expand");

        // Set the value into local storage, so that when we refresh the site, we still have the same sections expanded.
        localStorage.set(LOCAL_STORAGE_KEY, expandedSections.join(","));
    }
});

export const collapseAppsMenuSection = createAction(HIDE_APPS_MENU_SECTION, {
    slice: "ui.appsMenu",
    reducer: ({ action, state }) => {
        let { id: ids } = action.payload;
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        let expandedSections = _.get(state, "expandedSections", []);
        expandedSections = modifyExpandedSections(expandedSections, ids, "collapse");

        return { ...state, expandedSections };
    },
    middleware: ({ store, action, next }) => {
        next(action);
        let { id: ids } = action.payload;
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        let expandedSections = _.get(store.getState(), "ui.appsMenu.expandedSections", []);
        expandedSections = modifyExpandedSections(expandedSections, ids, "collapse");

        // Set the value into local storage, so that when we refresh the site, we still have the same sections expanded.
        localStorage.set(LOCAL_STORAGE_KEY, expandedSections.join(","));
    }
});

export const initSections = createAction(CHOOSE_INITIALLY_EXPANDED_SECTIONS, {
    slice: "ui.appsMenu",
    middleware: ({ next, action }) => {
        next(action);
        if (localStorage.get(LOCAL_STORAGE_KEY)) {
            dispatch(expandAppsMenuSection({ id: localStorage.get(LOCAL_STORAGE_KEY).split(",") }));
        }
    }
});
