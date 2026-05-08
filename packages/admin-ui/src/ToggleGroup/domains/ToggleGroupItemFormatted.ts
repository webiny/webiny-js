import type React from "react";

export interface ToggleGroupItemFormatted {
    id: string;
    label?: string | React.ReactNode;
    value: string;
    disabled: boolean;
    icon?: React.ReactNode;
    iconPosition: "start" | "end";
}
