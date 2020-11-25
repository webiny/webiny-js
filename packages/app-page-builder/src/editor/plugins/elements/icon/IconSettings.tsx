import React, { useMemo, useCallback } from "react";
import Input from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Input";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import IconPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/IconPicker";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdateElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/updateElement/types";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { get, set } from "dot-prop-immutable";
import { useRecoilValue } from "recoil";
import { getSvg } from "./utils";

const IconSettings = () => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const handler = useEventActionHandler();
    const { data: { icon = {} } = {} } = element;

    const updateElement = (args: UpdateElementActionArgsType) => {
        handler.trigger(new UpdateElementActionEvent(args));
    };

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
    }, [element.id]);

    const updateIcon = useCallback(value => setData("id", value.id), [setData]);
    const updateColor = useCallback(value => setData("color", value), [setData]);
    const updateColorPreview = useCallback(value => setData("color", value, false), [setData]);
    const updateWidth = useCallback(value => setData("width", value), [setData]);

    return (
        <Tabs>
            <Tab label={"Icon"}>
                <IconPicker
                    label={"Icon"}
                    value={icon.id}
                    updateValue={updateIcon}
                    removable={false}
                />
                <Input
                    label={"Width"}
                    value={icon.width}
                    updateValue={updateWidth}
                    placeholder="50"
                />
                <ColorPicker
                    label={"Color"}
                    value={icon.color}
                    updateValue={updateColor}
                    updatePreview={updateColorPreview}
                />
            </Tab>
        </Tabs>
    );
};

export default React.memo(IconSettings);
