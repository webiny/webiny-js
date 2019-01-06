//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import ColorPicker from "webiny-app-cms/editor/plugins/elementSettings/components/ColorPicker";
import Input from "webiny-app-cms/editor/plugins/elementSettings/components/Input";

const Settings = ({
    element,
    updateColor,
    updateColorPreview,
    updateHorizontalOffset,
    updateVerticalOffset,
    updateBlur,
    updateSpread
}: Object) => {
    const shadow = get(element, "data.settings.shadow", {});
    const { horizontal = 0, vertical = 0, blur = 0, spread = 0, color = "#000" } = shadow;
    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Shadow"}>
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
        updateSettings: ({ updateElement, element }) => {
            let historyUpdated = {};

            return (name, value, history = true) => {
                const newElement = set(element, `data.settings.shadow.${name}`, value);

                if (!history) {
                    updateElement({ element: newElement, history });
                    return;
                }

                if (historyUpdated[name] !== value) {
                    historyUpdated[name] = value;
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
    })
)(Settings);
