import React from "react";
import { ContainerElementInputsDecorator } from "./ContainerElementInputs";
import { FieldElementInputsDecorator } from "./FieldElementInputs";

export const FubElementInputs = () => {
    return (
        <>
            <ContainerElementInputsDecorator />
            <FieldElementInputsDecorator />
        </>
    );
};
