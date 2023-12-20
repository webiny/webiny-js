import React from "react";
import { Property } from "@webiny/react-properties";

export interface GroupFieldsProps {
    value: boolean;
}

export const GroupFields: React.FC<GroupFieldsProps> = ({ value }) => {
    return (
        <Property id="fileDetails" name={"fileDetails"}>
            <Property id={`drawer:groupFields`} name={"groupFields"} value={value} />
        </Property>
    );
};
