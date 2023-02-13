import React, { useMemo } from "react";
import PeText from "@webiny/app-page-builder/editor/components/Text/PeText";
import { PeText as LexicalPeText } from "~/components/PeText";
import { createComponentPlugin } from "@webiny/react-composition";
import get from "lodash/get";
import { applyFallbackDisplayMode } from "@webiny/app-page-builder/editor/plugins/elementSettings/elementSettingsUtils";
import { useElementById } from "@webiny/app-page-builder/editor/hooks/useElementById";
import { useDisplayMode } from "@webiny/app-page-builder/editor/hooks/useDisplayMode";
import { isValidLexicalData } from "@webiny/lexical-editor";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";

const DATA_NAMESPACE = "data.text";
export const PeTextPlugin = createComponentPlugin(PeText, Original => {
    return function PbTextPlugin({ elementId, tag: customTag, mediumEditorOptions }): JSX.Element {
        const [element] = useElementById(elementId);
        const variableValue = useElementVariableValue(element);
        const { displayMode } = useDisplayMode();

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
        const content = variableValue || element.data?.text?.data?.text;

        return isValidLexicalData(content) ? (
            <LexicalPeText elementId={elementId} tag={tag} />
        ) : (
            <Original elementId={elementId} tag={tag} mediumEditorOptions={mediumEditorOptions} />
        );
    };
});
