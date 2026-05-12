import type React from "react";

export interface ToggleItemFormatted {
    id: string;
    label?: string | React.ReactNode;
    value: string | number;
    checked: boolean;
    disabled: boolean;
    icon?: React.ReactNode;
    iconPosition: "start" | "end";
}
