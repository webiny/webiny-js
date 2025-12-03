import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface DropConfirmationProps {
    value: boolean;
}

export const DropConfirmation = ({ value }: DropConfirmationProps) => {
    const getId = useIdGenerator("dropConfirmation");

    return (
        <Property id="folder" name={"folder"}>
            <Property id={getId()} name={"dropConfirmation"} value={value} />
        </Property>
    );
};
