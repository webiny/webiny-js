// @flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, lifecycle, pure } from "recompose";
import { TopAppBarSecondary, TopAppBarSection } from "webiny-ui/TopAppBar";
import { ButtonDefault, ButtonIcon } from "webiny-ui/Button";
import { deactivateElement } from "webiny-app-cms/editor/actions";
import { getPlugin } from "webiny-plugins";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import Menu from "./components/Menu";
import { ReactComponent as NavigateBeforeIcon } from "webiny-app-cms/editor/assets/icons/navigate_before.svg";

const getElementActions = (plugin: Object) => {
    if (!plugin.settings) {
        return [];
    }

    const actions = plugin.settings.map(name => getPlugin(name || "cms-element-settings-divider"));

    return [...actions, getPlugin("cms-element-settings-save")].filter(pl => pl);
};

const ElementSettingsBar = pure(({ elementType, deactivateElement }) => {
    if (!elementType) {
        return null;
    }

    const plugin = getPlugin(elementType);
    if (!plugin) {
        return null;
    }

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
                    {actions.map((plugin, index) => {
                        return (
                            <div key={plugin.name + "-" + index} style={{ position: "relative" }}>
                                {plugin.renderAction({})}
                                {typeof plugin.renderMenu === "function" && (
                                    <Menu plugin={plugin} />
                                )}
                            </div>
                        );
                    })}
                </TopAppBarSection>
            </TopAppBarSecondary>
        </React.Fragment>
    );
});

export default compose(
    connect(
        state => {
            const element = getActiveElement(state);
            return {
                elementType: element ? element.type : null
            };
        },
        { deactivateElement }
    ),
    withKeyHandler(),
    lifecycle({
        componentDidMount() {
            const { addKeyHandler, deactivateElement } = this.props;
            addKeyHandler("escape", e => {
                e.preventDefault();
                deactivateElement();
            });
        },
        componentWillUnmount() {
            this.props.removeKeyHandler("escape");
        }
    })
)(ElementSettingsBar);
