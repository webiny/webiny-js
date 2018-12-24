import { default as localStorage } from "store";
import _ from "lodash";
import { set } from "dot-prop-immutable";

const LOCAL_STORAGE_KEY = "webiny_apps_menu_sections";

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

const expandAppsMenuSection = (ids, expandedSections) => {
    if (!Array.isArray(ids)) {
        ids = [ids];
    }

    return modifyExpandedSections(expandedSections, ids, "expand");
};

export default {
    showMenu: ({ ui }) => () => {
        ui.setState(ui => set(ui, "appsMenu.show", true));
    },
    hideMenu: ({ ui }) => () => {
        ui.setState(ui => set(ui, "appsMenu.show", false));
    },
    initSections: props => () => {
        if (localStorage.get(LOCAL_STORAGE_KEY)) {
            const sections = expandAppsMenuSection(
                localStorage.get(LOCAL_STORAGE_KEY).split(","),
                _.get(props, "ui.appsMenu.expandedSections", [])
            );

            localStorage.set(LOCAL_STORAGE_KEY, sections.join(","));
            props.ui.setState(ui => set(ui, "appsMenu.expandedSections", sections));
        }
    },
    showSection: props => (id: string) => {
        let sections = _.get(props, "ui.appsMenu.expandedSections", []);
        sections = modifyExpandedSections(sections, [id], "expand");
        localStorage.set(LOCAL_STORAGE_KEY, sections.join(","));
        props.ui.setState(ui => set(ui, "appsMenu.expandedSections", sections));
    },
    hideSection: props => (id: string) => {
        let sections = _.get(props, "ui.appsMenu.expandedSections", []);
        sections = modifyExpandedSections(sections, [id], "collapse");
        localStorage.set(LOCAL_STORAGE_KEY, sections.join(","));
        props.ui.setState(ui => set(ui, "appsMenu.expandedSections", sections));
    }
};
