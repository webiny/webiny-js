import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface ThumbnailConfig {
    type: string;
    element: JSX.Element;
}

export interface RendererProps {
    type: string;
    element: JSX.Element;
}

export const Thumbnail = makeDecoratable("Thumbnail", ({ type, element }: RendererProps) => {
    const getId = useIdGenerator("thumbnail");

    return (
        <Property id="fileDetails" name={"fileDetails"}>
            <Property id={getId(type)} name={"thumbnails"} array={true}>
                <Property id={getId(type, "type")} name={"type"} value={type} />
                <Property id={getId(type, "element")} name={"element"} value={element} />
            </Property>
        </Property>
    );
});
