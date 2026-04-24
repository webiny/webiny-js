import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export interface ColorProps {
    id: string;
    label?: string;
    value?: string;
    remove?: boolean;
    replace?: string;
    after?: string;
    before?: string;
}

export const Color = ({ id, label, value, remove, replace, after, before }: ColorProps) => {
    const getId = useIdGenerator("lexicalTheme");
    const propertyName = "colors";

    const toReplace = replace !== undefined ? getId(propertyName, replace) : undefined;
    const placeAfter = after !== undefined ? getId(propertyName, after) : undefined;
    const placeBefore = before !== undefined ? getId(propertyName, before) : undefined;

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property id={"lexicalTheme"} name={"lexicalTheme"}>
                <Property
                    id={getId(propertyName, id)}
                    name={propertyName}
                    array={true}
                    remove={remove}
                    replace={toReplace}
                    after={placeAfter}
                    before={placeBefore}
                >
                    <Property id={getId(propertyName, id, "id")} name={"id"} value={id} />
                    <Property id={getId(propertyName, id, "label")} name={"label"} value={label} />
                    <Property id={getId(propertyName, id, "value")} name={"value"} value={value} />
                </Property>
            </Property>
        </ConnectToProperties>
    );
};
