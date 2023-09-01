import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface IconProps {
    type: string;
    name: string;
    skinToneSupport?: boolean;
    category?: string;
    value: string;
    width?: number;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Icon: React.FC<IconProps> = ({
    type,
    name,
    skinToneSupport,
    category,
    value,
    width,
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
            {typeof skinToneSupport !== "undefined" ? (
                <Property
                    id={getId(name, "skinToneSupport")}
                    name={"skinToneSupport"}
                    value={skinToneSupport}
                />
            ) : null}
            {category ? (
                <Property id={getId(name, "category")} name={"category"} value={category} />
            ) : null}
            {width ? <Property id={getId(name, "width")} name={"width"} value={width} /> : null}
            <Property id={getId(name, "value")} name={"value"} value={value} />
        </Property>
    );
};
