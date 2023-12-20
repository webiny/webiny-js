import React from "react";
import { Property, useIdGenerator } from "../src";

export interface FilterProps {
    name: string;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const Filter = ({
    name,
    after = undefined,
    before = undefined,
    remove = false
}: FilterProps) => {
    const getId = useIdGenerator("filter");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property
            id={getId(name)}
            name={"filters"}
            remove={remove}
            array={true}
            before={placeBefore}
            after={placeAfter}
        >
            <Property id={getId(name, "name")} name={"name"} value={name} />
        </Property>
    );
};
