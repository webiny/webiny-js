import React from "react";
import { ButtonRendererWithVariables } from "~/render/variables/button";
import { ParagraphRendererWithVariables } from "~/render/variables/paragraph";
import { HeadingRendererWithVariables } from "~/render/variables/heading";

export const InjectElementVariables = () => {
    return (
        <>
            <ButtonRendererWithVariables />
            <ParagraphRendererWithVariables />
            <HeadingRendererWithVariables />
        </>
    );
};
