import React from "react";
import { makeDecoratable } from "~/index.js";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface TitleProps {
    value: string;
}

const BaseTitle = ({ value }: TitleProps) => {
    const getId = useIdGenerator("Title");

    return <Property id={getId("title")} name={"title"} value={value} />;
};

export const Title = makeDecoratable("Title", BaseTitle);
