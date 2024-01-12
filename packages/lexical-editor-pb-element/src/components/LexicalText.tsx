import React, { useCallback, useEffect, useMemo } from "react";
import { CoreOptions } from "medium-editor";
import { useElementById } from "@webiny/app-page-builder/editor/hooks/useElementById";
import { useDisplayMode } from "@webiny/app-page-builder/editor/hooks/useDisplayMode";
import { useActiveElement } from "@webiny/app-page-builder/editor/hooks/useActiveElement";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import { applyFallbackDisplayMode } from "@webiny/app-page-builder/editor/plugins/elementSettings/elementSettingsUtils";
import get from "lodash/get";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { LexicalEditor } from "~/LexicalEditor";

interface TextElementProps {
    elementId: string;
    mediumEditorOptions?: CoreOptions;
    tag?: string | [string, Record<string, any>];
}

const DATA_NAMESPACE = "data.text";
export const LexicalText = ({ elementId, tag: customTag }: TextElementProps) => {
    const [element] = useElementById(elementId);
    const { displayMode } = useDisplayMode();
    const [activeElement, setActiveElement] = useActiveElement();

    const { getUpdateValue } = useUpdateHandlers({
        element: element as PbEditorElement,
        dataNamespace: DATA_NAMESPACE
    });

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    useEffect(() => {
        if (elementId && elementId !== activeElement?.id) {
            setActiveElement(elementId);
        }
    }, [activeElement?.id, elementId]);

    const onChange = useCallback(
        (value: string) => {
            getUpdateValue(DATA_NAMESPACE)(value);
        },
        [getUpdateValue]
    );

    const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);

    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }

    const textContent = get(element, `${DATA_NAMESPACE}.data.text`);
    const tag = customTag || get(value, "tag");

    return (
        <DelayedOnChange value={textContent} onChange={onChange}>
            {({ value, onChange }) => <LexicalEditor tag={tag} value={value} onChange={onChange} />}
        </DelayedOnChange>
    );
};
