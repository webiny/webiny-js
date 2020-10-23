import React, { useEffect } from "react";
import Menu from "./components/Menu";
import {
    activeElementSelector,
    deactivateElementMutation,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { TopAppBarSecondary, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { plugins } from "@webiny/plugins";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { ReactComponent as NavigateBeforeIcon } from "@webiny/app-page-builder/editor/assets/icons/navigate_before.svg";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { userSettingsPlugins } from "@webiny/app-page-builder/editor/utils";

const divider = "pb-editor-page-element-settings-divider";

const getElementActions = plugin => {
    if (!plugin.settings) {
        return [];
    }

    const pluginSettings = [...userSettingsPlugins(plugin.elementType), ...plugin.settings];

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
const ElementSettingsBarContent = ({ plugin, deactivateElement }: ElementSettingsBarProps) => {
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
        <React.Fragment>
            <TopAppBarSecondary fixed>
                <TopAppBarSection alignStart>
                    <ButtonDefault onClick={deactivateElement}>
                        <ButtonIcon icon={<NavigateBeforeIcon />} /> Back
                    </ButtonDefault>
                </TopAppBarSection>
                <TopAppBarSection>
                    {/*
                    Render an action button for each relevant action.
                    Each `element` can have different `element-settings` plugins.
                    If no `settings` array is defined in an `element` plugin, all settings are shown.
                    */}
                    {actions.map(({ plugin, options }, index) => {
                        console.log(`${plugin.name}: ${typeof plugin.renderMenu === "function"}`);
                        return (
                            <div key={plugin.name + "-" + index} style={{ position: "relative" }}>
                                {plugin.renderAction({ options })}
                                {typeof plugin.renderMenu === "function" && (
                                    <Menu plugin={plugin} options={options} />
                                )}
                            </div>
                        );
                    })}
                </TopAppBarSection>
            </TopAppBarSecondary>
        </React.Fragment>
    );
};

const ElementSettingsBarContentMemoized = React.memo(ElementSettingsBarContent);

const ElementSettingsBar = () => {
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
        <ElementSettingsBarContentMemoized plugin={plugin} deactivateElement={deactivateElement} />
    );
};

export default React.memo(ElementSettingsBar);
