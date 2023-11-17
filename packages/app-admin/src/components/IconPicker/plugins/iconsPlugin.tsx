import React from "react";

import { ColorPicker } from "@webiny/ui/ColorPicker";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

import { IconPickerPlugin } from "~/components/IconPicker/types";
import { IconPickerTab } from "~/components/IconPicker/IconPickerTab";

export const iconsPlugin = (): IconPickerPlugin => {
    return {
        type: "admin-icon-picker",
        name: "admin-icon-picker-icons",
        iconType: "icon",
        renderIcon(icon, size) {
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${icon.width || 512} 512`}
                    color={icon?.color || "inherit"}
                    dangerouslySetInnerHTML={{ __html: icon.value }}
                />
            );
        },
        renderTab(props) {
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
