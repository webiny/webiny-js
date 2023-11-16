import React from "react";
import styled from "@emotion/styled";

import { Menu } from "@webiny/ui/Menu";

import { Icon, IconRenderer } from "./IconRenderer";
import { IconProps } from "./config/IconPackProvider";

const SKIN_TONES = ["", "\u{1f3fb}", "\u{1f3fc}", "\u{1f3fd}", "\u{1f3fe}", "\u{1f3ff}"];

const SkinToneSelectWrapper = styled.div`
    padding: 4px;
    width: 32px;
    flex-shrink: 0;
    background: #fff;
    border-radius: 1px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    display: inline-block;
    cursor: pointer;
`;

const SkinTonesGrid = styled.div`
    display: grid;
    gap: 4px;
    padding: 4px;
`;

const SkinTone = styled.div`
    cursor: pointer;
`;

type SkinToneSelectProps = {
    emojis: IconProps[];
    icon: Icon | null;
    onChange: (value: Icon) => void;
};

export const SkinToneSelect = ({ emojis, icon, onChange }: SkinToneSelectProps) => {
    const hasSkinToneSupport = emojis.find(emoji => emoji.value === icon?.value)?.skinToneSupport;

    if (!icon || !hasSkinToneSupport) {
        return (
            <SkinToneSelectWrapper>
                {icon?.type === "emoji" && <IconRenderer icon={icon} />}
            </SkinToneSelectWrapper>
        );
    }

    return (
        <Menu
            open={hasSkinToneSupport}
            handle={
                <SkinToneSelectWrapper>
                    <IconRenderer icon={icon} />
                </SkinToneSelectWrapper>
            }
        >
            {({ closeMenu }: { closeMenu: () => void }) => (
                <SkinTonesGrid>
                    {SKIN_TONES.map((skinTone, index) => (
                        <SkinTone
                            key={index}
                            onClick={() => {
                                onChange({ ...icon, skinTone, color: undefined });
                                closeMenu();
                            }}
                        >
                            <IconRenderer
                                icon={{ ...icon, value: icon.value + skinTone, skinTone: "" }}
                            />
                        </SkinTone>
                    ))}
                </SkinTonesGrid>
            )}
        </Menu>
    );
};
