import type React from "react";

export interface RadioItemParams {
    id?: string;
    label: string | React.ReactNode;
    value: string | number;
    disabled?: boolean;
    description?: React.ReactNode;
}
