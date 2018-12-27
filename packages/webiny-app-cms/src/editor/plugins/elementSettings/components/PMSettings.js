//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Grid } from "webiny-ui/Grid";
import { get } from "lodash";
import { set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement } from "webiny-app-cms/editor/actions";
import { ReactComponent as BorderOuterIcon } from "webiny-app-cms/editor/assets/icons/border_outer.svg";
import { ReactComponent as BorderLeftIcon } from "webiny-app-cms/editor/assets/icons/border_left.svg";
import { ReactComponent as BorderRightIcon } from "webiny-app-cms/editor/assets/icons/border_right.svg";
import { ReactComponent as BorderTopIcon } from "webiny-app-cms/editor/assets/icons/border_top.svg";
import { ReactComponent as BorderBottomIcon } from "webiny-app-cms/editor/assets/icons/border_bottom.svg";
import PMPropertyInput from "./PMPropertyInput";
import Footer from "./PMFooter";

/**
 * PMSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

type Props = Object & {
    value: Object | number
};

const PMSettings = ({ value, getUpdateValue, getUpdatePreview }: Props) => {
    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Desktop"}>
                    {!value.advanced ? (
                        <Grid className={"no-bottom-padding"}>
                            <PMPropertyInput
                                icon={<BorderOuterIcon />}
                                value={get(value, "desktop.all", 0)}
                                updateValue={getUpdateValue("desktop.all")}
                                updatePreview={getUpdatePreview("desktop.all")}
                            />
                        </Grid>
                    ) : (
                        <Grid className={"no-bottom-padding"}>
                            <PMPropertyInput
                                icon={<BorderTopIcon />}
                                value={get(value, "desktop.top", 0)}
                                updateValue={getUpdateValue("desktop.top")}
                                updatePreview={getUpdatePreview("desktop.top")}
                            />
                            <PMPropertyInput
                                icon={<BorderRightIcon />}
                                value={get(value, "desktop.right", 0)}
                                updateValue={getUpdateValue("desktop.right")}
                                updatePreview={getUpdatePreview("desktop.right")}
                            />
                            <PMPropertyInput
                                icon={<BorderBottomIcon />}
                                value={get(value, "desktop.bottom", 0)}
                                updateValue={getUpdateValue("desktop.bottom")}
                                updatePreview={getUpdatePreview("desktop.bottom")}
                            />
                            <PMPropertyInput
                                icon={<BorderLeftIcon />}
                                value={get(value, "desktop.left", 0)}
                                updateValue={getUpdateValue("desktop.left")}
                                updatePreview={getUpdatePreview("desktop.left")}
                            />
                        </Grid>
                    )}
                    <Footer
                        advanced={value.advanced || false}
                        toggleAdvanced={getUpdateValue("advanced")}
                    />
                </Tab>
                <Tab label={"Mobile"}>
                    {!value.advanced ? (
                        <Grid className={"no-bottom-padding"}>
                            <PMPropertyInput
                                icon={<BorderOuterIcon />}
                                value={get(value, "mobile.all", 0)}
                                updateValue={getUpdateValue("mobile.all")}
                                updatePreview={getUpdatePreview("mobile.all")}
                            />
                        </Grid>
                    ) : (
                        <Grid className={"no-bottom-padding"}>
                            <PMPropertyInput
                                icon={<BorderTopIcon />}
                                value={get(value, "mobile.top", 0)}
                                updateValue={getUpdateValue("mobile.top")}
                                updatePreview={getUpdatePreview("mobile.top")}
                            />
                            <PMPropertyInput
                                icon={<BorderRightIcon />}
                                value={get(value, "mobile.right", 0)}
                                updateValue={getUpdateValue("mobile.right")}
                                updatePreview={getUpdatePreview("mobile.right")}
                            />
                            <PMPropertyInput
                                icon={<BorderBottomIcon />}
                                value={get(value, "mobile.bottom", 0)}
                                updateValue={getUpdateValue("mobile.bottom")}
                                updatePreview={getUpdatePreview("mobile.bottom")}
                            />
                            <PMPropertyInput
                                icon={<BorderLeftIcon />}
                                value={get(value, "mobile.left", 0)}
                                updateValue={getUpdateValue("mobile.left")}
                                updatePreview={getUpdatePreview("mobile.left")}
                            />
                        </Grid>
                    )}
                    <Footer
                        advanced={value.advanced || false}
                        toggleAdvanced={getUpdateValue("advanced")}
                    />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

export default compose(
    withActiveElement({ shallow: true }),
    connect(
        (state, { element, styleAttribute }: Object) => {
            const valueKey = "settings.style." + styleAttribute;
            return {
                valueKey,
                value: get(element, valueKey, {})
            };
        },
        { updateElement }
    ),
    withHandlers({
        updateSettings: ({ element, updateElement, valueKey }: Object) => {
            let historyUpdated = {};

            return (name: string, newValue: mixed, history = false) => {
                const propName = `${valueKey}.${name}`;

                if (name !== "advanced") {
                    newValue = parseInt(newValue) || 0;
                }

                if (!history) {
                    updateElement({
                        element: set(element, propName, newValue),
                        history
                    });
                    return;
                }

                if (historyUpdated[propName] !== newValue) {
                    historyUpdated[propName] = newValue;
                    updateElement({ element: set(element, propName, newValue) });
                }
            };
        }
    }),
    withHandlers({
        getUpdateValue: ({ updateSettings }: Object) => {
            const handlers = {};
            return (name: string) => {
                if (!handlers[name]) {
                    return value => updateSettings(name, value, true);
                }

                return handlers[name];
            };
        },
        getUpdatePreview: ({ updateSettings }: Object) => {
            const handlers = {};
            return (name: string) => {
                if (!handlers[name]) {
                    return value => updateSettings(name, value, false);
                }

                return handlers[name];
            };
        }
    })
)(PMSettings);
