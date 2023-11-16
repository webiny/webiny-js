import React from "react";

import { ColorPicker } from "@webiny/ui/ColorPicker";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

import { IconPickerTabPlugin } from "~/components/IconPicker/types";
import { IconPickerTab } from "~/components/IconPicker/IconPickerTab";

export const iconsTabPlugin = (): IconPickerTabPlugin => {
    return {
        type: "icon-picker-tab",
        name: "icon-picker-tab-icons",
        iconType: "icon",
        render(props) {
            return (
                <IconPickerTab
                    key={props.label}
                    {...props}
                    onChange={icon => props.onChange({ ...icon, color: props.color })}
                >
                    <DelayedOnChange
                        value={props.color}
                        onChange={color => {
                            props.onColorChange(color);

                            if (props.value && props.value.type === "icon") {
                                props.onChange({ ...props.value, color }, false);
                            }
                        }}
                    >
                        {({ value, onChange }) => <ColorPicker value={value} onChange={onChange} />}
                    </DelayedOnChange>
                </IconPickerTab>
            );
        }
    };
};
