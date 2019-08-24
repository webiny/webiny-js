//@flow
import * as React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { compose } from "recompose";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { isEqual } from "lodash";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import Select from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Select";
import Slider from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Slider";
import Selector from "./Selector";
import withUpdateHandlers from "../components/withUpdateHandlers";

type Props = Object & {
    getUpdateValue: Function,
    getUpdatePreview: Function
};

const options = ["none", "solid", "dashed", "dotted"];
const DATA_NAMESPACE = "data.settings.border";
const EMPTY_OBJECT = {};

const Settings = ({ getUpdateValue, getUpdatePreview }: Props) => {
    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Border"}>
                    <ColorPicker
                        label={"Color"}
                        valueKey={DATA_NAMESPACE + ".color"}
                        defaultValue={"#fff"}
                        updateValue={getUpdateValue("color")}
                        updatePreview={getUpdatePreview("color")}
                    />
                    <Slider
                        label={"Width"}
                        valueKey={DATA_NAMESPACE + ".width"}
                        defaultValue={0}
                        updateValue={getUpdateValue("width")}
                        updatePreview={getUpdatePreview("width")}
                        min={0}
                        max={20}
                        step={1}
                    />
                    <Slider
                        label={"Radius"}
                        valueKey={DATA_NAMESPACE + ".radius"}
                        defaultValue={0}
                        updateValue={getUpdateValue("radius")}
                        updatePreview={getUpdatePreview("radius")}
                        min={0}
                        max={100}
                        step={1}
                    />
                    <Select
                        label={"Style"}
                        valueKey={DATA_NAMESPACE + ".style"}
                        defaultValue={"none"}
                        updateValue={getUpdateValue("style")}
                        options={options}
                    />
                    <Selector
                        label={"Borders"}
                        valueKey={DATA_NAMESPACE + ".borders"}
                        defaultValue={EMPTY_OBJECT}
                        updateValue={getUpdateValue("borders")}
                    />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

export default compose(
    connect(
        state => {
            const { id, type, path } = getActiveElement(state);
            return { element: { id, type, path } };
        },
        { updateElement },
        null,
        { areStatePropsEqual: isEqual }
    ),
    withUpdateHandlers({ namespace: DATA_NAMESPACE })
)(Settings);
