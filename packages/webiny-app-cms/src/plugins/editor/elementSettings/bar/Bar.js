import React from "react";
import { connect } from "react-redux";
import { compose, lifecycle } from "recompose";
import { TopAppBarSecondary, TopAppBarSection } from "webiny-ui/TopAppBar";
import { ButtonDefault, ButtonIcon } from "webiny-ui/Button";
import { deactivateElement } from "webiny-app-cms/editor/actions";
import { getPlugin } from "webiny-app/plugins";
import { getActivePlugin } from "webiny-app-cms/editor/selectors";
import { withActiveElement, withKeyHandler } from "webiny-app-cms/editor/components";
import Sidebar from "./components/Sidebar";
import Menu from "./components/Menu";
import { ReactComponent as NavigateBeforeIcon } from "webiny-app-cms/editor/assets/icons/navigate_before.svg";

const getElementActions = plugin => {
    if (!plugin.element.settings) {
        return [];
    }

    return plugin.element.settings.map(name => getPlugin(name || "element-settings-divider"));
};

const Bar = ({ parent, element, activePlugin, deactivateElement }) => {
    const plugin = getPlugin(element.type);
    const actions = getElementActions(plugin);

    return (
        <React.Fragment>
            <TopAppBarSecondary fixed>
                <TopAppBarSection alignStart>
                    <ButtonDefault onClick={() => deactivateElement()}>
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
                        const active = activePlugin === plugin.name;

                        return (
                            <div key={plugin.name + "-" + index} style={{ position: "relative" }}>
                                {plugin.renderAction({ parent, element, active })}
                                {typeof plugin.renderMenu === "function" && (
                                    <Menu plugin={plugin} active={active} />
                                )}
                            </div>
                        );
                    })}
                </TopAppBarSection>
            </TopAppBarSecondary>
            {/*
            Sidebar component is rendered if an `element-settings` plugin has `renderSidebar` function.
            This element only serves as a drawer element. Its content is rendered via the relevant `plugin`.
            See `Advanced` plugin for reference.
            */}
            {actions.filter(plugin => typeof plugin.renderSidebar === "function").map(plugin => {
                return (
                    <Sidebar
                        key={plugin.name}
                        plugin={plugin}
                        active={activePlugin === plugin.name}
                    />
                );
            })}
        </React.Fragment>
    );
};

export default compose(
    withKeyHandler(),
    withActiveElement(),
    connect(
        state => ({
            activePlugin: getActivePlugin("cms-element-settings")(state)
        }),
        { deactivateElement }
    ),
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
)(Bar);
