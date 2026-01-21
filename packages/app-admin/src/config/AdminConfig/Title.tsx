import React from "react";
import { makeDecoratable } from "~/index.js";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface TitleProps {
    value: string;
}

const BaseTitle = ({ value }: TitleProps) => {
    const getId = useIdGenerator("Tenant");

    return (
        <Property id={getId("tenant")} name={"tenant"}>
            <Property id={getId("name")} name={"name"} value={value} />
        </Property>
    );
};

export const Title = makeDecoratable("Title", BaseTitle);
