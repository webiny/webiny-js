import type React from "react";

export interface SegmentedControlItemFormatted {
    id: string;
    label: string | React.ReactNode;
    value: string;
    disabled: boolean;
    icon?: React.ReactNode;
}

