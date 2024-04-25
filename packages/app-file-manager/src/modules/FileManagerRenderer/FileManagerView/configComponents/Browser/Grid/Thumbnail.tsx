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
    const getId = useIdGenerator("browser:grid:thumbnail");

    return (
        <Property id="browser" name={"browser"}>
            <Property id="grid" name={"grid"}>
                <Property id={getId(type)} name={"itemThumbnails"} array={true}>
                    <Property id={getId(type, "type")} name={"type"} value={type} />
                    <Property id={getId(type, "element")} name={"element"} value={element} />
                </Property>
            </Property>
        </Property>
    );
});
