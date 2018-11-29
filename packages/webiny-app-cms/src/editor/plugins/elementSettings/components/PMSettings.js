//@flow
import React from "react";
import { connect } from "react-redux";
import { compose, withProps, withHandlers } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Grid } from "webiny-ui/Grid";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement, setTmp } from "webiny-app-cms/editor/actions";
import { getTmp } from "webiny-app-cms/editor/selectors";
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

const PMSettings = ({
    title,
    advanced,
    toggleAdvanced,
    value,
    getUpdateValue,
    getUpdatePreview
}: Props) => {
    return (
        <React.Fragment>
            <Tabs>
                <Tab label={title}>
                    {!advanced ? (
                        <Grid className={"no-bottom-padding"}>
                            <PMPropertyInput
                                icon={<BorderOuterIcon />}
                                value={value}
                                updateValue={getUpdateValue("value")}
                                updatePreview={getUpdatePreview("value")}
                            />
                        </Grid>
                    ) : (
                        <Grid className={"no-bottom-padding"}>
                            <PMPropertyInput
                                icon={<BorderTopIcon />}
                                value={value.top}
                                updateValue={getUpdateValue("top")}
                                updatePreview={getUpdatePreview("top")}
                            />
                            <PMPropertyInput
                                icon={<BorderRightIcon />}
                                value={value.right}
                                updateValue={getUpdateValue("right")}
                                updatePreview={getUpdatePreview("right")}
                            />
                            <PMPropertyInput
                                icon={<BorderBottomIcon />}
                                value={value.bottom}
                                updateValue={getUpdateValue("bottom")}
                                updatePreview={getUpdatePreview("bottom")}
                            />
                            <PMPropertyInput
                                icon={<BorderLeftIcon />}
                                value={value.left}
                                updateValue={getUpdateValue("left")}
                                updatePreview={getUpdatePreview("left")}
                            />
                        </Grid>
                    )}
                    <Footer advanced={advanced} toggleAdvanced={toggleAdvanced} />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

export default compose(
    withActiveElement({ shallow: true }),
    connect(
        (state, { styleAttribute, element }: Object) => {
            const tmpKey = `settings.${element.id}.${styleAttribute}`;
            return {
                tmpKey,
                tmpValue: getTmp(state, tmpKey),
                valueKey: "settings.style." + styleAttribute
            };
        },
        { updateElement, setTmp }
    ),
    withHandlers({
        getValueObject: ({ element, valueKey }: Object) => () => {
            const padding = get(element, valueKey) || "";
            const values: Array<string> = padding.split(" ");
            const advanced = values.length > 1;

            let value = parseInt(values[0]) || 0;
            if (advanced) {
                value = {
                    top: parseInt(values[0]) || 0,
                    right: parseInt(values[1]) || 0,
                    bottom: parseInt(values[2]) || 0,
                    left: parseInt(values[3]) || 0
                };
            }

            return { advanced, value };
        },
        getValueCss: () => (value: Object | number) => {
            if (typeof value === "number") {
                return value + "px";
            }

            return [value.top, value.right, value.bottom, value.left].join("px ") + "px";
        }
    }),
    withHandlers({
        updateSettings: ({
            element,
            updateElement,
            valueKey,
            getValueObject,
            getValueCss
        }: Object) => {
            let historyUpdated = false;

            return (name: string, newValue: mixed, history = false) => {
                // Make sure value is an integer
                newValue = parseInt(newValue) || 0;
                // Get current value as object
                let { value } = getValueObject();

                let newElement = { ...element };

                if (name !== "value") {
                    value[name] = newValue;
                } else {
                    value = newValue;
                }

                newValue = getValueCss(value);
                if (!history) {
                    updateElement({ element: set(newElement, valueKey, newValue), history });
                    return;
                }

                if (historyUpdated !== newValue) {
                    historyUpdated = newValue;
                    updateElement({ element: set(newElement, valueKey, newValue), history: true });
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
        },
        toggleAdvanced: ({
            getValueCss,
            valueKey,
            element,
            updateElement,
            setTmp,
            tmpValue,
            getValueObject,
            tmpKey
        }: Object) => (toggle: boolean) => {
            const { value } = getValueObject();

            if (toggle) {
                updateElement({
                    element: set(
                        element,
                        valueKey,
                        getValueCss(
                            tmpValue || {
                                top: value,
                                right: value,
                                bottom: value,
                                left: value
                            }
                        )
                    )
                });
            } else {
                updateElement({
                    element: set(element, valueKey, getValueCss(tmpValue || 0))
                });
            }
            setTmp({ key: tmpKey, value });
        }
    }),
    withProps(({ getValueObject }) => getValueObject())
)(PMSettings);
