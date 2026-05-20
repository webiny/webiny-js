import React from "react";
import { Property } from "@webiny/react-properties";

export interface FilterByTagProps {
    remove?: boolean;
}

export const FilterByTags = ({ remove }: FilterByTagProps) => {
    return (
        <Property id="browser" name={"browser"}>
            <Property id="filterByTags" name={"filterByTags"} value={true} remove={remove} />
        </Property>
    );
};
