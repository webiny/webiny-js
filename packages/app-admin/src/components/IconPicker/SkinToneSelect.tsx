import React from "react";
import styled from "@emotion/styled";

import { Menu } from "@webiny/ui/Menu";

import { IconProvider, IconRenderer } from "./IconRenderer";
import { Icon } from "./types";

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
    icon: Icon | null;
    onChange: (value: Icon) => void;
    checkSkinToneSupport: (icon: Icon) => boolean;
};

export const SkinToneSelect = ({ icon, onChange, checkSkinToneSupport }: SkinToneSelectProps) => {
    if (!icon || icon?.type !== "emoji") {
        return <SkinToneSelectWrapper />;
    }

    const hasSkinToneSupport = checkSkinToneSupport(icon);

    if (!hasSkinToneSupport) {
        return (
            <SkinToneSelectWrapper>
                <IconProvider icon={icon}>
                    <IconRenderer />
                </IconProvider>
            </SkinToneSelectWrapper>
        );
    }

    return (
        <Menu
            open={hasSkinToneSupport}
            handle={
                <SkinToneSelectWrapper>
                    <IconProvider icon={icon}>
                        <IconRenderer />
                    </IconProvider>
                </SkinToneSelectWrapper>
            }
        >
            {({ closeMenu }) => (
                <SkinTonesGrid>
                    {SKIN_TONES.map((skinTone, index) => (
                        <SkinTone
                            key={index}
                            onClick={() => {
                                onChange({ ...icon, skinTone, color: undefined });
                                closeMenu();
                            }}
                        >
                            <IconProvider icon={icon}>
                                <IconRenderer />
                            </IconProvider>
                            {/*<IconRenderer
                                icon={{ ...icon, value: icon.value + skinTone, skinTone: "" }}
                            />*/}
                        </SkinTone>
                    ))}
                </SkinTonesGrid>
            )}
        </Menu>
    );
};
