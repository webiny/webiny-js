import type React from "react";

export interface SegmentedControlItemParams {
    id?: string;
    label: string | React.ReactNode;
    value: string | number;
    disabled?: boolean;
    icon?: React.ReactNode;
}


