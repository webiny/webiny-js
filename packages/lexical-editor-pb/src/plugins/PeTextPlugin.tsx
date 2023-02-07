import React, { useMemo } from "react";
import PeText from "@webiny/app-page-builder/editor/components/Text/PeText";
import { PeText as LexicalPeText } from "~/components/PeText";
import { createComponentPlugin } from "@webiny/react-composition";
import { useRecoilState, useRecoilValue } from "recoil";
import {
    elementWithChildrenByIdSelector,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import get from "lodash/get";
import { applyFallbackDisplayMode } from "@webiny/app-page-builder/editor/plugins/elementSettings/elementSettingsUtils";
import { isParagraphTag } from "~/utils/isParagraphTag";
import { isHeadingTag } from "~/utils/isHeadingTag";

const DATA_NAMESPACE = "data.text";
export const PeTextPlugin = createComponentPlugin(PeText, Original => {
    return function PbTextPlugin({ elementId, tag: customTag, mediumEditorOptions }): JSX.Element {
        const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
        const [{ displayMode }] = useRecoilState(uiAtom);
        const fallbackValue = useMemo(
            () =>
                applyFallbackDisplayMode(displayMode, mode =>
                    get(element, `${DATA_NAMESPACE}.${mode}`)
                ),
            [displayMode]
        );

        if (!element) {
            return <Original elementId={elementId} />;
        }

        const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);
        const tag = customTag || get(value, "tag");

        return isParagraphTag(tag) || isHeadingTag(tag) ? (
            <LexicalPeText elementId={elementId} tag={tag} />
        ) : (
            <Original elementId={elementId} tag={tag} mediumEditorOptions={mediumEditorOptions} />
        );
    };
});
