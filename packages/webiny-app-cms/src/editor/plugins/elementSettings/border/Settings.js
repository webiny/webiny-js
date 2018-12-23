//@flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import { Grid } from "webiny-ui/Grid";
import ColorPicker from "webiny-app-cms/editor/plugins/elementSettings/components/ColorPicker";
import Select from "webiny-app-cms/editor/plugins/elementSettings/components/Select";
import Slider from "webiny-app-cms/editor/plugins/elementSettings/components/Slider";

type Props = Object & {
    element: Object,
    updateElement: Function
};

const options = ["none", "solid", "dashed", "dotted"];

const Settings = (props: Props) => {
    const {
        element,
        updateBorderStyle,
        updateBorderRadius,
        updateBorderRadiusPreview,
        updateBorderColor,
        updateBorderColorPreview,
        updateBorderWidth,
        updateBorderWidthPreview
    } = props;
    const { settings } = element;

    const borderWidth = get(settings, "style.border.width", 0);
    const borderRadius = get(settings, "style.border.radius", 0);
    const borderColor = get(settings, "style.border.color", "#fff");
    const borderStyle = get(settings, "style.border.style", "none");

    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Border"}>
                    <Grid>
                        <ColorPicker
                            label={"Color"}
                            value={borderColor}
                            updateValue={updateBorderColor}
                            updatePreview={updateBorderColorPreview}
                        />
                        <Slider
                            label={"Width"}
                            value={borderWidth}
                            updateValue={updateBorderWidth}
                            updatePreview={updateBorderWidthPreview}
                            min={0}
                            max={20}
                            discrete
                            step={1}
                        />
                        <Slider
                            label={"Radius"}
                            value={borderRadius}
                            updateValue={updateBorderRadius}
                            updatePreview={updateBorderRadiusPreview}
                            min={0}
                            max={100}
                            discrete
                            step={1}
                        />
                        <Select
                            label={"Style"}
                            value={borderStyle}
                            updateValue={updateBorderStyle}
                            options={options}
                        />
                    </Grid>
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

export default compose(
    connect(
        state => ({
            element: getActiveElement(state)
        }),
        { updateElement }
    ),
    withHandlers({
        updateSettings: ({ updateElement, element }) => {
            const historyUpdated = {};

            return (name, value, history = true) => {
                const attrKey = `settings.style.border.${name}`;

                if (!history) {
                    updateElement({ element: set(element, attrKey, value), history });
                    return;
                }

                if (historyUpdated[name] !== value) {
                    historyUpdated[name] = value;
                    updateElement({ element: set(element, attrKey, value) });
                }
            };
        }
    }),
    withHandlers({
        updateBorderStyle: ({ updateSettings }) => (value: string) =>
            updateSettings("style", value),
        updateBorderRadius: ({ updateSettings }) => (value: string) =>
            updateSettings("radius", value),
        updateBorderRadiusPreview: ({ updateSettings }) => (value: string) =>
            updateSettings("radius", value, false),
        updateBorderColor: ({ updateSettings }) => (value: string) =>
            updateSettings("color", value),
        updateBorderColorPreview: ({ updateSettings }) => (value: string) =>
            updateSettings("color", value, false),
        updateBorderWidth: ({ updateSettings }) => (value: string) =>
            updateSettings("width", value),
        updateBorderWidthPreview: ({ updateSettings }) => (value: string) =>
            updateSettings("width", value, false)
    })
)(Settings);
