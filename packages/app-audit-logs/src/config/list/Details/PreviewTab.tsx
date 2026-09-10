import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import type { IAuditLog } from "~/types.js";

export interface PreviewTabConfig {
    name: string;
    label: string;
    element: React.ReactElement;
    canRender?: (auditLog: IAuditLog) => boolean;
}

export interface PreviewTabProps {
    name: string;
    label: string;
    element: React.ReactElement;
    canRender?: (auditLog: IAuditLog) => boolean;
}

export const PreviewTab = ({ name, label, element, canRender }: PreviewTabProps) => {
    const getId = useIdGenerator("previewTab");

    return (
        <Property id="details" name={"details"}>
            <Property id={getId(name)} name={"tabs"} array={true}>
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "label")} name={"label"} value={label} />
                <Property id={getId(name, "element")} name={"element"} value={element} />
                {canRender ? (
                    <Property id={getId(name, "canRender")} name={"canRender"} value={canRender} />
                ) : null}
            </Property>
        </Property>
    );
};
