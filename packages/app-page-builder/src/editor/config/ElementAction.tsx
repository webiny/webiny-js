import React from "react";
import { Element, ElementProps } from "./Element";
import { IconButton } from "./IconButton";
import { makeDecoratable } from "@webiny/react-composition";

const getElementId = (value: string) => {
    return ["elementAction", value].join(":");
};

export type ElementActionProps = Omit<ElementProps, "scope" | "group" | "id">;

const BaseElementAction = makeDecoratable("ElementAction", (props: ElementActionProps) => {
    return (
        <Element
            {...props}
            scope={"elementActions"}
            id={getElementId(props.name)}
            before={props.before ? getElementId(props.before) : undefined}
            after={props.after ? getElementId(props.after) : undefined}
        />
    );
});

export const ElementAction = Object.assign(BaseElementAction, { IconButton });
