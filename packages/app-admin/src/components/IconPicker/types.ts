import { ReactNode } from "react";

import { Plugin } from "@webiny/plugins/types";

export type Icon = {
    type: string;
    name: string;
    value: string;
    color?: string;
    skinTone?: string;
    width?: number;
};

export type IconPickerTabProps = {
    label: string;
    rows: Row[];
    value: Icon | null;
    onChange: (icon: Icon, close?: boolean) => void;
    filter: string;
    onFilterChange: (value: string) => void;
    color: string;
    onColorChange: (value: string) => void;
    children?: ReactNode;
};

export type IconPickerTabPlugin = Plugin & {
    type: "icon-picker-tab";
    name: string;
    iconType: string;
    render: (props: IconPickerTabProps) => ReactNode;
};

type IconsRow = {
    type: "icons";
    icons: Icon[];
};

type CategoryNameRow = {
    type: "category-name";
    name: string;
};

export type Row = IconsRow | CategoryNameRow;
