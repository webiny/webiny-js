// @flow
import React, { useEffect } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { TopAppBarSecondary, TopAppBarSection } from "@webiny/ui/TopAppBar";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { deactivateElement } from "@webiny/app-page-builder/editor/actions";
import { getPlugin, getPlugins } from "@webiny/plugins";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import Menu from "./components/Menu";
import { ReactComponent as NavigateBeforeIcon } from "@webiny/app-page-builder/editor/assets/icons/navigate_before.svg";

const divider = "pb-page-element-settings-divider";

const getElementActions = (plugin: Object) => {
    if (!plugin.settings) {
        return [];
    }

    const actions = plugin.settings.map(pl => {
        if (typeof pl === "string") {
            return { plugin: getPlugin(pl || divider), options: {} };
        }

        if (Array.isArray(pl)) {
            return { plugin: getPlugin(pl[0] || divider), options: pl[1] };
        }

        return null;
    });

    return [
        ...actions,
        { plugin: getPlugin("pb-page-element-settings-advanced") },
        { plugin: getPlugin("pb-page-element-settings-save") }
    ].filter(pl => pl);
};

const ElementSettingsBar = React.memo(({ elementType, deactivateElement }) => {
    if (!elementType) {
        return null;
    }

    const plugin = getPlugins("pb-page-element").find(pl => pl.elementType === elementType);

    if (!plugin) {
        return null;
    }

    return <ElementSettingsBarContent plugin={plugin} deactivateElement={deactivateElement} />;
});

const ElementSettingsBarContent = React.memo(({ plugin, deactivateElement }) => {
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
});

export default connect(
    state => {
        const element = getActiveElement(state);
        return {
            elementType: element ? element.type : null
        };
    },
    { deactivateElement }
)(ElementSettingsBar);
