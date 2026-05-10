import type React from "react";

export interface ToggleItemDto {
    id?: string;
    label?: React.ReactNode;
    value?: number | string | boolean;
    checked?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "start" | "end";
}
