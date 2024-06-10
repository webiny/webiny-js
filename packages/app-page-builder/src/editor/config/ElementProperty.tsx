import React from "react";
import { Element, ElementProps } from "./Element";
import { makeDecoratable } from "@webiny/react-composition";
import { Elements, ElementsProps } from "~/editor/config/Elements";

const SCOPE = "elementProperties";

export type ElementPropertyProps = Omit<ElementProps, "scope" | "id">;

const getElementId = (value: string) => {
    return ["elementProperty", value].join(":");
};

const BaseElementProperty = makeDecoratable("ElementProperty", (props: ElementPropertyProps) => {
    return (
        <Element
            {...props}
            scope={SCOPE}
            id={getElementId(props.name)}
            before={props.before ? getElementId(props.before) : undefined}
            after={props.after ? getElementId(props.after) : undefined}
        />
    );
});

const ElementPropertyGroups = {
    STYLE: "styleGroup",
    ELEMENT: "elementGroup"
};

export const ElementProperty = Object.assign(BaseElementProperty, ElementPropertyGroups);

export interface ElementPropertiesProps {
    group?: string;
    transform?: ElementsProps["transform"];
}

export const ElementProperties = (props: ElementPropertiesProps) => {
    return <Elements group={props.group} scope={SCOPE} transform={props.transform} />;
};
