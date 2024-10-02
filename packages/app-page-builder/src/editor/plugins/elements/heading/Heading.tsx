import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { Element } from "@webiny/app-page-builder-elements/types";
import { HeadingRenderer } from "@webiny/app-page-builder-elements/renderers/heading";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { useActiveElementId } from "~/editor";
import { ActiveHeadingRenderer } from "./ActiveHeadingRenderer";

interface HeadingProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

export const Heading = (props: HeadingProps) => {
    const { element, ...rest } = props;
    const [activeElementId] = useActiveElementId();
    const isActive = activeElementId === element.id;

    if (isActive) {
        return (
            <CompositionScope name={"pb.heading"}>
                <ActiveHeadingRenderer element={element as Element} {...rest} />
            </CompositionScope>
        );
    }

    return <HeadingRenderer element={element as Element} {...rest} />;
};
