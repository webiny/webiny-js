import React, { useEffect } from "react";
import {
    activeElementSelector,
    deactivateElementMutation,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { userSettingsPluginsHelper } from "@webiny/app-page-builder/editor/helpers";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { css } from "emotion";

const classes = {
    wrapper: css({
        // Subtract the height of top bar and tabs.
        height: "calc(100vh - 112px)",
        overflowY: "auto",
        overflowX: "hidden",

        // We need this for the first "Accordion" Item
        "& .webiny-ui-accordion-item:first-child > .webiny-ui-accordion-item__list-item": {
            zIndex: 2
        }
    })
};

const divider = "pb-editor-page-element-settings-divider";

const getElementActions = plugin => {
    if (!plugin.settings) {
        return [];
    }

    const pluginSettings = [...userSettingsPluginsHelper(plugin.elementType), ...plugin.settings];

    const actions = pluginSettings.map(pl => {
        if (typeof pl === "string") {
            return { plugin: plugins.byName(pl || divider), options: {} };
        }

        if (Array.isArray(pl)) {
            return { plugin: plugins.byName(pl[0] || divider), options: pl[1] };
        }

        return null;
    });

    const elementActions = [
        ...actions,
        { plugin: plugins.byName("pb-editor-page-element-settings-advanced"), options: {} },
        { plugin: plugins.byName("pb-editor-page-element-settings-save"), options: {} }
    ];

    return (
        elementActions
            // Eliminate empty plugins
            .filter(pl => {
                return pl && pl.plugin;
            })
            // Eliminate duplicate plugins
            .filter(
                (pl, index, array) =>
                    array.findIndex(item => item.plugin.name === pl.plugin.name) === index
            )
    );
};

type ElementSettingsBarProps = { plugin: PbEditorPageElementPlugin; deactivateElement: () => void };
const ElementSettingsSideBarContent = ({ plugin, deactivateElement }: ElementSettingsBarProps) => {
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            deactivateElement();
        });
        return () => removeKeyHandler("escape");
    });

    const actions = getElementActions(plugin);

    return (
        <div className={classes.wrapper}>
            {/*
                TODO: Check whether the below statement is true anymore.
                Render an action button for each relevant action.
                Each `element` can have different `element-settings` plugins.
                If no `settings` array is defined in an `element` plugin, all settings are shown.
            */}
            {actions.map(({ plugin, options }, index) => {
                return (
                    <div key={plugin.name + "-" + index} style={{ position: "relative" }}>
                        {typeof plugin.render === "function" && plugin.render({ options })}
                    </div>
                );
            })}
        </div>
    );
};

const ElementSettingsSideBarContentMemoized = React.memo(ElementSettingsSideBarContent);

const ElementSettingsSideBar = () => {
    const element = useRecoilValue(activeElementSelector);
    const setUiAtomValue = useSetRecoilState(uiAtom);
    if (!element) {
        return null;
    }
    const elementType = element.type;
    if (!elementType) {
        return null;
    }

    const deactivateElement = () => {
        setUiAtomValue(deactivateElementMutation);
    };

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === elementType);

    if (!plugin) {
        return null;
    }

    return (
        <ElementSettingsSideBarContentMemoized
            plugin={plugin}
            deactivateElement={deactivateElement}
        />
    );
};

export default React.memo(ElementSettingsSideBar);
