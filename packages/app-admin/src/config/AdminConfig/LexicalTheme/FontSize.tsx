import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export interface FontSizeProps {
    id: string;
    label: string;
    /**
     * What lands in the `font-size` declaration. A `var(--wby-text-…)` reference makes the choice
     * follow the active theme; a plain length does not.
     */
    value: string;
    remove?: boolean;
}

export const FontSize = ({ id, label, value, remove }: FontSizeProps) => {
    const getId = useIdGenerator("lexicalTheme");
    const propertyName = "fontSizes";

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={"lexicalTheme"} name={"lexicalTheme"}>
                <Property
                    id={getId(propertyName, id)}
                    name={propertyName}
                    array={true}
                    remove={remove}
                >
                    <Property id={getId(propertyName, id, "label")} name={"label"} value={label} />
                    <Property id={getId(propertyName, id, "value")} name={"value"} value={value} />
                </Property>
            </Property>
        </ConnectToProperties>
    );
};
