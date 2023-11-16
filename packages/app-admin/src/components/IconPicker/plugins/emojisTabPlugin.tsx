import React from "react";

import { IconPickerTabPlugin } from "~/components/IconPicker/types";
import { IconPickerTab } from "~/components/IconPicker/IconPickerTab";
import { SkinToneSelect } from "~/components/IconPicker/SkinToneSelect";

export const emojisTabPlugin = (): IconPickerTabPlugin => {
    return {
        type: "icon-picker-tab",
        name: "icon-picker-tab-emojis",
        iconType: "emoji",
        render(props) {
            return (
                <IconPickerTab key={props.label} {...props}>
                    <SkinToneSelect emojis={[]} icon={props.value} onChange={props.onChange} />
                </IconPickerTab>
            );
        }
    };
};
