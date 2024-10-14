import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import styled from "@emotion/styled";

import { ColorPicker } from "@webiny/ui/ColorPicker";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";

import { useIcon } from "..";
import { IconPickerTab } from "../IconPickerTab";
import { useIconPicker } from "../IconPickerPresenterProvider";
import { IconPickerConfig } from "../config";
import { Icon } from "../types";

/**
 * NOTE: Avoid using `@emotion/styled` in icon renderer components across all plugins.
 * This is crucial for serializing component rendering into a string value as plain HTML,
 * which is necessary for usage in the website application. Please use inline styles here
 * to ensure proper serialization.
 */

interface SimpleIcon extends Icon {
    color: string;
}

const IconSvg = () => {
    const { icon, size } = useIcon<SimpleIcon>();

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${icon.width || 512} 512`}
            color={icon?.color || "inherit"}
            dangerouslySetInnerHTML={{ __html: icon.value }}
            style={{
                verticalAlign: "middle"
            }}
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
            {({ value, onChange }) => (
                <ColorPicker align="right" value={value} onChange={onChange} />
            )}
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

    const [color, setColor] = useState("inherit");

    useEffect(() => {
        if (color === "inherit" && isSimpleIcon(selectedIcon)) {
            setColor(selectedIcon.color);
        }
    }, [selectedIcon]);

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
        presenter.closeMenu();
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
            <IconPickerConfig.IconType name={"icon"}>
                <IconPickerConfig.IconType.Icon element={<IconSvg />} />
                <IconPickerConfig.IconType.Tab element={<IconTab />} />
            </IconPickerConfig.IconType>
        </IconPickerConfig>
    );
};
