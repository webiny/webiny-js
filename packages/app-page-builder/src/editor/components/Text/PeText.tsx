import React, { useCallback, useMemo } from "react";
import get from "lodash/get";
import { CoreOptions } from "medium-editor";
import { makeDecoratable } from "@webiny/react-composition";
import { PbEditorElement } from "~/types";
import useUpdateHandlers from "../../plugins/elementSettings/useUpdateHandlers";
import ReactMediumEditor from "../../components/MediumEditor";
import { applyFallbackDisplayMode } from "../../plugins/elementSettings/elementSettingsUtils";
import { useActiveElementId, useDisplayMode, useElementById } from "~/editor";

const DATA_NAMESPACE = "data.text";

interface TextElementProps {
    elementId: string;
    mediumEditorOptions?: CoreOptions;
    tag?: string | [string, Record<string, any>];
}

export const PeText = makeDecoratable(
    "PeText",
    ({ elementId, mediumEditorOptions, tag: customTag }: TextElementProps) => {
        const [element] = useElementById(elementId);
        const { displayMode } = useDisplayMode();
        const [activeElementId, setActiveElementId] = useActiveElementId();
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

        const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);

        const onChange = useCallback(
            (value: string) => {
                getUpdateValue(DATA_NAMESPACE)(value);
            },
            [getUpdateValue]
        );

        const onSelect = useCallback(() => {
            // Mark element active on editor element selection
            if (elementId && activeElementId !== elementId) {
                setActiveElementId(elementId);
            }
        }, [activeElementId, elementId]);

        // required due to re-rendering when set content atom and still nothing in elements atom
        if (!element) {
            return null;
        }

        const textContent = get(element, `${DATA_NAMESPACE}.data.text`);
        const tag = customTag || get(value, "tag");

        return (
            <ReactMediumEditor
                elementId={elementId}
                tag={tag}
                value={textContent}
                onChange={onChange}
                options={mediumEditorOptions}
                onSelect={onSelect}
            />
        );
    }
);
