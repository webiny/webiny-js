import React from "react";
import { observer } from "mobx-react-lite";
import styled from "@emotion/styled";
import { Menu } from "@webiny/ui/Menu";
import { useIcon } from "~/components/IconPicker";
import { IconPickerTab } from "~/components/IconPicker/IconPickerTab";
import { IconProvider } from "~/components/IconPicker/IconRenderer";
import { useIconPicker } from "~/components/IconPicker/IconPickerPresenterProvider";
import { IconType } from "~/components/IconPicker/config/IconType";
import { IconPickerConfig } from "~/components/IconPicker/config";
import { Icon } from "~/components/IconPicker/types";

const SKIN_TONES = ["", "\u{1f3fb}", "\u{1f3fc}", "\u{1f3fd}", "\u{1f3fe}", "\u{1f3ff}"];

const EmojiStyled = styled.div`
    color: black;
    width: 32px;
    height: 32px;
    font-size: 26px;
    line-height: 32px;
`;

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

interface Emoji extends Icon {
    skinTone: string;
    skinToneSupport: boolean;
}

const Emoji = () => {
    const { icon } = useIcon<Emoji>();

    return <EmojiStyled>{icon.skinTone ? icon.value + icon.skinTone : icon.value}</EmojiStyled>;
};

type SkinToneSelectProps = {
    icon: Icon | null;
    hasSkinToneSupport: boolean;
    onChange: (skinTone: string) => void;
};

export const SkinToneSelect = ({ icon, hasSkinToneSupport, onChange }: SkinToneSelectProps) => {
    if (!icon || !isEmoji(icon)) {
        return <SkinToneSelectWrapper />;
    }

    if (!hasSkinToneSupport) {
        return (
            <SkinToneSelectWrapper>
                <IconProvider icon={icon}>
                    <Emoji />
                </IconProvider>
            </SkinToneSelectWrapper>
        );
    }

    return (
        <Menu
            handle={
                <SkinToneSelectWrapper>
                    <IconProvider icon={icon}>
                        <Emoji />
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
                                onChange(skinTone);
                                closeMenu();
                            }}
                        >
                            <IconProvider icon={{ ...icon, skinTone }}>
                                <Emoji />
                            </IconProvider>
                        </SkinTone>
                    ))}
                </SkinTonesGrid>
            )}
        </Menu>
    );
};

/**
 * @see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 */
const isEmoji = (icon: Icon | null): icon is Emoji => {
    if (!icon) {
        return false;
    }
    return icon.type === "emoji";
};

// `observer` is necessary to react to changes on the `presenter`, which is an observable.
const EmojiTab = observer(() => {
    const presenter = useIconPicker();
    const { selectedIcon } = presenter.vm;

    console.log("selectedIcon", selectedIcon);

    const onSkinToneChange = (skinTone: string) => {
        if (isEmoji(selectedIcon)) {
            presenter.setIcon({ ...selectedIcon, skinTone });
        } else {
            presenter.closeMenu();
        }
    };

    const onIconSelect = (icon: Icon) => {
        presenter.setIcon(icon);
    };

    // For this, we don't need to look up the icon in the full icons list. We already have this
    // information right here, in the `selectedIcon`.
    const hasSkinToneSupport = isEmoji(selectedIcon) ? selectedIcon.skinToneSupport : false;

    return (
        <IconPickerTab
            label={"Emojis"}
            onChange={onIconSelect}
            actions={
                <SkinToneSelect
                    icon={selectedIcon}
                    hasSkinToneSupport={hasSkinToneSupport}
                    onChange={onSkinToneChange}
                />
            }
        />
    );
});

export const EmojiPlugin = () => {
    return (
        <IconPickerConfig>
            <IconType name={"emoji"}>
                <IconType.Icon element={<Emoji />} />
                <IconType.Tab element={<EmojiTab />} />
            </IconType>
        </IconPickerConfig>
    );
};
