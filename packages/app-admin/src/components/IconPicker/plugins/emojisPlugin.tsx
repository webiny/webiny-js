import React from "react";
import styled from "@emotion/styled";

import { IconPickerPlugin } from "~/components/IconPicker/types";
import { IconPickerTab } from "~/components/IconPicker/IconPickerTab";
import { SkinToneSelect } from "~/components/IconPicker/SkinToneSelect";

const EmojiStyled = styled.div<{ size: number }>`
    color: black;
    width: ${({ size }) => `${size}px`};
    height: ${({ size }) => `${size}px`};
    font-size: ${({ size }) => `${size * 0.8}px`};
    line-height: ${({ size }) => `${size}px`};
`;

export const emojisPlugin = (): IconPickerPlugin => {
    return {
        type: "admin-icon-picker",
        name: "admin-icon-picker-emojis",
        iconType: "emoji",
        renderIcon(icon, size) {
            return (
                <EmojiStyled size={size}>
                    {icon.skinTone ? icon.value + icon.skinTone : icon.value}
                </EmojiStyled>
            );
        },
        renderTab(props) {
            return (
                <IconPickerTab key={props.label} {...props}>
                    <SkinToneSelect
                        icon={props.value}
                        onChange={props.onChange}
                        checkSkinToneSupport={props.checkSkinToneSupport}
                    />
                </IconPickerTab>
            );
        }
    };
};
