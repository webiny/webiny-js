import { useUi } from "@webiny/app/hooks/useUi";
import { default as localStorage } from "store";
import { get } from "lodash";
import { set } from "dot-prop-immutable";

const LOCAL_STORAGE_KEY = "webiny_apps_menu_sections";

const modifyExpandedSections = (
    expandedSections: Array<string>,
    names: Array<string>,
    action: string
) => {
    const returnNames = [...expandedSections];
    names.forEach(id => {
        if (action === "expand") {
            !returnNames.includes(id) && returnNames.push(id);
        } else {
            returnNames.includes(id) && returnNames.splice(returnNames.indexOf(id), 1);
        }
    });

    return returnNames;
};

const expandAppsMenuSection = (names, expandedSections) => {
    if (!Array.isArray(names)) {
        names = [names];
    }

    return modifyExpandedSections(expandedSections, names, "expand");
};

export default () => {
    const ui = useUi();

    const hook = {
        showMenu: () => {
            ui.setState(ui => set(ui, "appsMenu.show", true));
        },
        hideMenu: () => {
            ui.setState(ui => set(ui, "appsMenu.show", false));
        },
        menuIsShown(): boolean {
            return get(ui, "appsMenu.show", false);
        },
        expandSection(name: string) {
            let sections = get(ui, "appsMenu.expandedSections", []);
            sections = modifyExpandedSections(sections, [name], "expand");
            localStorage.set(LOCAL_STORAGE_KEY, sections.join(","));
            ui.setState(ui => set(ui, "appsMenu.expandedSections", sections));
        },
        collapseSection(name: string) {
            let sections = get(ui, "appsMenu.expandedSections", []);
            sections = modifyExpandedSections(sections, [name], "collapse");
            localStorage.set(LOCAL_STORAGE_KEY, sections.join(","));
            ui.setState(ui => set(ui, "appsMenu.expandedSections", sections));
        },
        toggleSection(name: string) {
            if (hook.sectionIsExpanded(name)) {
                return hook.collapseSection(name);
            }
            return hook.expandSection(name);
        },
        sectionIsExpanded(name: string) {
            return get(ui, "appsMenu.expandedSections", []).includes(name);
        },
        initSections: () => {
            if (!localStorage.get(LOCAL_STORAGE_KEY)) {
                return;
            }

            const sections = expandAppsMenuSection(
                localStorage.get(LOCAL_STORAGE_KEY).split(","),
                get(ui, "appsMenu.expandedSections", [])
            );

            localStorage.set(LOCAL_STORAGE_KEY, sections.join(","));
            ui.setState(ui => set(ui, "appsMenu.expandedSections", sections));
        }
    };

    return hook;
};
