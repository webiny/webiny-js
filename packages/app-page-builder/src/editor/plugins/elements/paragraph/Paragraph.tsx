import React from "react";
import { CompositionScope } from "@webiny/app-admin";
import { ParagraphRenderer } from "@webiny/app-page-builder-elements/renderers/paragraph";
import type { Element } from "@webiny/app-page-builder-elements/types";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { useActiveElementId } from "~/editor";
import { ActiveParagraphRenderer } from "./ActiveParagraphRenderer";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

interface ParagraphProps {
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

export const Paragraph = (props: ParagraphProps) => {
    const { element, ...rest } = props;
    const [activeElementId] = useActiveElementId();
    const isActive = activeElementId === element.id;

    if (isActive) {
        return (
            <CompositionScope name={"pb.paragraph"}>
                <ActiveParagraphRenderer element={element as Element} {...rest} />
            </CompositionScope>
        );
    }

    return <ParagraphRenderer element={element as Element} {...rest} />;
};
