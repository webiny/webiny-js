import type React from "react";
import { useContext, useEffect, useRef } from "react";
import { generateId } from "~/utils.js";
import { SegmentedControlTabsContext } from "./SegmentedControlTabsContext.js";

export interface SegmentedControlTabProps {
    value: string;
    trigger: React.ReactNode;
    icon?: React.ReactElement;
    content: React.ReactNode;
    disabled?: boolean;
    visible?: boolean;
}

export const SegmentedControlTab = (props: SegmentedControlTabProps) => {
    const { addTab, removeTab } = useContext(SegmentedControlTabsContext);
    const idRef = useRef(generateId());

    useEffect(() => {
        addTab({ ...props, id: idRef.current, visible: props.visible ?? true });
    }, [props]);

    useEffect(() => {
        return () => removeTab(idRef.current);
    }, []);

    return null;
};
