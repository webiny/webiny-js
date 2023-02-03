import React from "react";
import PeText from "@webiny/app-page-builder/editor/components/Text/PeText";
import { PeText as LexicalPeText } from "~/components/PeText";
import { createComponentPlugin } from "@webiny/react-composition";
import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
export const PeTextPlugin = createComponentPlugin(PeText, Original => {
    return function PbTextPlugin({ elementId }): JSX.Element {
        const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));

        if (!element) {
            return <Original elementId={elementId} />;
        }

        return <LexicalPeText elementId={elementId} />;
    };
});
