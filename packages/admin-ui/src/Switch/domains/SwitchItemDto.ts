import type React from "react";

export interface SwitchItemDto {
    id?: string;
    label: React.ReactNode;
    value?: number | string | boolean;
    checked?: boolean;
    disabled?: boolean;
}
