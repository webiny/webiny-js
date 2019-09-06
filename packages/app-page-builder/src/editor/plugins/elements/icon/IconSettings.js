//@flow
import React, { useMemo, useCallback } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import Input from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Input";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import IconPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/IconPicker";
import { getSvg } from "./utils";

const IconSettings = ({ element, updateElement }: Object) => {
    const { data: { icon = {} } = {} } = element;

    const setData = useMemo(() => {
        const historyUpdated = {};

        return (name, value, history = true) => {
            const attrKey = `data.icon.${name}`;

            let newElement = set(element, attrKey, value);
            const { id, width, color } = get(newElement, "data.icon");
            newElement = set(newElement, "data.icon.svg", getSvg(id, { width, color }));

            if (!history) {
                updateElement({ element: newElement, history });
                return;
            }

            if (historyUpdated[name] !== value) {
                historyUpdated[name] = value;
                updateElement({ element: newElement });
            }
        };
    }, [element, updateElement]);

    const updateIcon = useCallback(value => setData("id", value.id), [setData]);
    const updateColor = useCallback(value => setData("color", value), [setData]);
    const updateColorPreview = useCallback(value => setData("color", value, false), [setData]);
    const updateWidth = useCallback(value => setData("width", value)[setData]);

    return (
        <React.Fragment>
            <Tabs>
                <Tab label={"Icon"}>
                    <IconPicker label={"Icon"} value={icon.id} updateValue={updateIcon} />
                    <Input label={"Width"} value={icon.width || 50} updateValue={updateWidth} />
                    <ColorPicker
                        label={"Color"}
                        value={icon.color}
                        updateValue={updateColor}
                        updatePreview={updateColorPreview}
                    />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(IconSettings);
