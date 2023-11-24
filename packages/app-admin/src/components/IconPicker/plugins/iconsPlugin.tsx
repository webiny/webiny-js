import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import styled from "@emotion/styled";

import { ColorPicker } from "@webiny/ui/ColorPicker";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

import { useIcon } from "..";
import { IconPickerTab } from "../IconPickerTab";
import { useIconPicker } from "../IconPickerPresenterProvider";
import { IconType } from "../config/IconType";
import { IconPickerConfig } from "../config";
import { Icon } from "../types";

interface SimpleIcon extends Icon {
    color: string;
}

const IconSvg = () => {
    const { icon } = useIcon<SimpleIcon>();

    return (
        <svg
            width={32}
            height={32}
            viewBox={`0 0 ${icon.width || 512} 512`}
            color={icon?.color || "inherit"}
            dangerouslySetInnerHTML={{ __html: icon.value }}
        />
    );
};

interface IconColorPickerProps {
    color: string;
    onChange: (value: string) => void;
}

const IconColorPicker = ({ color, onChange }: IconColorPickerProps) => {
    return (
        <DelayedOnChange value={color} onChange={onChange}>
            {({ value, onChange }) => <ColorPicker value={value} onChange={onChange} />}
        </DelayedOnChange>
    );
};

const Color = styled.span<{ color: string }>`
    color: ${({ color }) => color};
`;

/**
 * @see https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 */
const isSimpleIcon = (icon: Icon | null): icon is SimpleIcon => {
    if (!icon) {
        return false;
    }
    return icon.type === "icon";
};

const IconTab = observer(() => {
    const presenter = useIconPicker();
    const { selectedIcon } = presenter.vm;

    const [color, setColor] = useState(() => {
        if (isSimpleIcon(selectedIcon)) {
            return selectedIcon.color;
        }
        return "inherit";
    });

    const onColorChange = (color: string) => {
        setColor(color);
        if (isSimpleIcon(selectedIcon)) {
            presenter.setIcon({ ...selectedIcon, color });
        } else {
            presenter.closeMenu();
        }
    };

    const onIconSelect = (icon: Icon) => {
        // Set icon and assign current color.
        presenter.setIcon({ ...icon, color });
    };

    return (
        <IconPickerTab
            label={"Icons"}
            onChange={onIconSelect}
            cellDecorator={cell => <Color color={color}>{cell}</Color>}
            actions={<IconColorPicker color={color} onChange={onColorChange} />}
        />
    );
});

export const SimpleIconPlugin = () => {
    return (
        <IconPickerConfig>
            <IconType name={"icon"}>
                <IconType.Icon element={<IconSvg />} />
                <IconType.Tab element={<IconTab />} />
            </IconType>
        </IconPickerConfig>
    );
};
