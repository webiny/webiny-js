import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export interface AllowCustomColorsProps {
    value?: boolean;
}

export const AllowCustomColors = ({ value = true }: AllowCustomColorsProps) => {
    const getId = useIdGenerator("lexicalTheme");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={"lexicalTheme"} name={"lexicalTheme"}>
                <Property
                    id={getId("allowCustomColors")}
                    name={"allowCustomColors"}
                    value={value}
                />
            </Property>
        </ConnectToProperties>
    );
};
