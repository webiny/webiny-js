import React from "react";
import { Property } from "@webiny/react-properties";

export interface WidthProps {
    value: string;
}

export const Width = ({ value }: WidthProps) => {
    return (
        <Property id="fileDetails" name={"fileDetails"}>
            <Property id={`drawer:width`} name={"width"} value={value} />
        </Property>
    );
};
