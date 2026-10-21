"use client";
import React, { useContext } from "react";

interface SlotLabelValue {
    parentId: string;
    slot: string;
    label: string;
}

const SlotLabelContext = React.createContext<SlotLabelValue | undefined>(undefined);

/**
 * Name one slot in the editor: while it's empty, its drop area shows the label (e.g., the page content
 * area of a layout it belongs to). Other slots rendered inside are not labeled.
 */
export const SlotLabel = ({
    children,
    ...value
}: SlotLabelValue & { children: React.ReactNode }) => {
    return <SlotLabelContext.Provider value={value}>{children}</SlotLabelContext.Provider>;
};

export const useSlotLabel = (parentId: string, slot: string) => {
    const value = useContext(SlotLabelContext);
    return value && value.parentId === parentId && value.slot === slot ? value.label : undefined;
};
