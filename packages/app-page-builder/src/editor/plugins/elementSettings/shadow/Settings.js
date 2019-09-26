//@flow
import * as React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { isEqual } from "lodash";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import Input from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Input";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";

const DATA_NAMESPACE = "data.settings.shadow";

const Settings = ({ element, updateElement }: Object) => {
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        updateElement,
        dataNamespace: DATA_NAMESPACE
    });

    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Shadow"}>
                    <ColorPicker
                        label={"Color"}
                        valueKey={DATA_NAMESPACE + ".color"}
                        updateValue={getUpdateValue("color")}
                        updatePreview={getUpdatePreview("color")}
                    />

                    <Input
                        label={"Horizontal offset"}
                        valueKey={DATA_NAMESPACE + ".horizontal"}
                        updateValue={getUpdateValue("horizontal")}
                    />

                    <Input
                        label={"Vertical offset"}
                        valueKey={DATA_NAMESPACE + ".vertical"}
                        updateValue={getUpdateValue("vertical")}
                    />

                    <Input
                        label={"Blur"}
                        valueKey={DATA_NAMESPACE + ".blur"}
                        updateValue={getUpdateValue("blur")}
                    />

                    <Input
                        label={"Spread"}
                        valueKey={DATA_NAMESPACE + ".spread"}
                        updateValue={getUpdateValue("spread")}
                    />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

export default connect(
    state => {
        const { id, type, path } = getActiveElement(state);
        return { element: { id, type, path } };
    },
    { updateElement },
    null,
    { areStatePropsEqual: isEqual }
)(Settings);
