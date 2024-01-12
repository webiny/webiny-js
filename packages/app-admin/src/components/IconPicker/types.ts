import { ReactNode } from "react";

import { Plugin } from "@webiny/plugins/types";

/**
 * We want to have an abstract type, which does not define specifics of each possible icon (like color or skin tone).
 */
export type Icon = {
    type: "icon" | "emoji" | "custom" | string;
    name: string;
    value: string;
    [key: string]: any;
};

export type IconPickerTabProps = {
    label: string;
    rows: IconPickerGridRow[];
    value: Icon | null;
    onChange: (icon: Icon, close?: boolean) => void;
    filter: string;
    onFilterChange: (value: string) => void;
    color: string;
    onColorChange: (value: string) => void;
    checkSkinToneSupport: (icon: Icon) => boolean;
    children?: ReactNode;
};

export type IconPickerPlugin = Plugin & {
    type: "admin-icon-picker";
    name: string;
    iconType: string;
    renderIcon: (icon: Icon, size: number) => JSX.Element;
    renderTab: (props: IconPickerTabProps) => ReactNode;
};

type IconsRow = {
    type: "icons";
    icons: Icon[];
};

type CategoryNameRow = {
    type: "category-name";
    name: string;
};

export type IconPickerGridRow = IconsRow | CategoryNameRow;

export enum ICON_PICKER_SIZE {
    SMALL = "small"
}
