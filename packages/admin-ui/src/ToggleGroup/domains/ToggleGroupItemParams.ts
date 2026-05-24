import type React from "react";

export interface ToggleGroupItemParams {
    id?: string;
    label?: React.ReactNode;
    value: string;
    disabled?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "start" | "end";
    tooltip?: string;
}
