//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers, withProps } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import { Grid } from "webiny-ui/Grid";
import ColorPicker from "webiny-app-cms/editor/plugins/elementSettings/components/ColorPicker";
import Input from "webiny-app-cms/editor/plugins/elementSettings/components/Input";

const Settings = ({
    color,
    horizontal,
    vertical,
    spread,
    blur,
    updateColor,
    updateColorPreview,
    updateHorizontalOffset,
    updateVerticalOffset,
    updateBlur,
    updateSpread
}: Object) => {
    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Shadow"}>
                    <Grid>
                        <ColorPicker
                            label={"Color"}
                            value={color}
                            updateValue={updateColor}
                            updatePreview={updateColorPreview}
                        />

                        <Input
                            label={"Horizontal offset"}
                            value={horizontal}
                            updateValue={updateHorizontalOffset}
                        />

                        <Input
                            label={"Vertical offset"}
                            value={vertical}
                            updateValue={updateVerticalOffset}
                        />

                        <Input label={"Blur"} value={blur} updateValue={updateBlur} />

                        <Input label={"Spread"} value={spread} updateValue={updateSpread} />
                    </Grid>
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};
export default compose(
    connect(
        state => ({ element: getActiveElement(state) }),
        { updateElement }
    ),
    withHandlers({
        getShadowObject: ({ element }) => () => {
            // box-shadow: none|h-offset v-offset blur spread color |inset|initial|inherit;
            const value = get(element, "settings.style.boxShadow") || "";
            const arr = value.split(" ");
            const boxShadow = arr.splice(0, 4);
            boxShadow.push(arr.join(" "));

            return {
                horizontal: parseInt(boxShadow[0]) || 0,
                vertical: parseInt(boxShadow[1]) || 0,
                blur: parseInt(boxShadow[2]) || 0,
                spread: parseInt(boxShadow[3]) || 0,
                color: boxShadow[4] || "#000"
            };
        },

        getShadowCss: () => values => {
            return [
                values.horizontal + "px",
                values.vertical + "px",
                values.blur + "px",
                values.spread + "px",
                values.color
            ].join(" ");
        }
    }),
    withHandlers({
        updateSettings: ({ getShadowObject, getShadowCss, updateElement, element }) => {
            let historyUpdated = null;

            return (name, value, history = true) => {
                const shadow = getShadowObject();
                shadow[name] = value === "" ? 0 : value;
                const shadowValue = getShadowCss(shadow);

                const newElement = set(element, "settings.style.boxShadow", shadowValue);

                if (!history) {
                    updateElement({ element: newElement, history });
                    return;
                }

                if (historyUpdated !== shadowValue) {
                    historyUpdated = shadowValue;
                    updateElement({ element: newElement });
                }
            };
        }
    }),
    withHandlers({
        updateColor: ({ updateSettings }) => (value: string) => updateSettings("color", value),
        updateColorPreview: ({ updateSettings }) => (value: string) =>
            updateSettings("color", value, false),
        updateHorizontalOffset: ({ updateSettings }) => (value: string) =>
            updateSettings("horizontal", value),
        updateVerticalOffset: ({ updateSettings }) => (value: string) =>
            updateSettings("vertical", value),
        updateBlur: ({ updateSettings }) => (value: string) => updateSettings("blur", value),
        updateSpread: ({ updateSettings }) => (value: string) => updateSettings("spread", value)
    }),
    withProps(({ getShadowObject }) => ({ ...getShadowObject() }))
)(Settings);
