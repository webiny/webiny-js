import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface IconConfig {
    type: string;
    name: string;
    color?: string;
    skinTone?: string;
    value: string;
}

export interface IconProps {
    type: string;
    name: string;
    color?: string;
    skinTone?: string;
    value: string;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Icon: React.FC<IconProps> = ({
    type,
    name,
    color,
    skinTone,
    value,
    after = undefined,
    before = undefined,
    remove = false
}) => {
    const getId = useIdGenerator("icon");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property
            id={getId(name)}
            name={"icons"}
            remove={remove}
            array={true}
            before={placeBefore}
            after={placeAfter}
        >
            <Property id={getId(name, "type")} name={"type"} value={type} />
            <Property id={getId(name, "name")} name={"name"} value={name} />
            {color ? <Property id={getId(name, "color")} name={"color"} value={color} /> : null}
            {skinTone ? (
                <Property id={getId(name, "skinTone")} name={"skinTone"} value={skinTone} />
            ) : null}
            <Property id={getId(name, "value")} name={"value"} value={value} />
        </Property>
    );
};
