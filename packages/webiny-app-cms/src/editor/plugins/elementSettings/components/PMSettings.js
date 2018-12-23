//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Grid } from "webiny-ui/Grid";
import { get, set } from "dot-prop-immutable";
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

const PMSettings = ({ value, title, getUpdateValue, getUpdatePreview }: Props) => {
    return (
        <React.Fragment>
            <Tabs>
                <Tab label={title}>
                    {!value.advanced ? (
                        <Grid className={"no-bottom-padding"}>
                            <PMPropertyInput
                                icon={<BorderOuterIcon />}
                                value={value.all || 0}
                                updateValue={getUpdateValue("all")}
                                updatePreview={getUpdatePreview("all")}
                            />
                        </Grid>
                    ) : (
                        <Grid className={"no-bottom-padding"}>
                            <PMPropertyInput
                                icon={<BorderTopIcon />}
                                value={value.top || 0}
                                updateValue={getUpdateValue("top")}
                                updatePreview={getUpdatePreview("top")}
                            />
                            <PMPropertyInput
                                icon={<BorderRightIcon />}
                                value={value.right || 0}
                                updateValue={getUpdateValue("right")}
                                updatePreview={getUpdatePreview("right")}
                            />
                            <PMPropertyInput
                                icon={<BorderBottomIcon />}
                                value={value.bottom || 0}
                                updateValue={getUpdateValue("bottom")}
                                updatePreview={getUpdatePreview("bottom")}
                            />
                            <PMPropertyInput
                                icon={<BorderLeftIcon />}
                                value={value.left || 0}
                                updateValue={getUpdateValue("left")}
                                updatePreview={getUpdatePreview("left")}
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
