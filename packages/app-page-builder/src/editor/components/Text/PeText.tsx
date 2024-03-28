import React, { useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import get from "lodash/get";
import { CoreOptions } from "medium-editor";
import { makeDecoratable } from "@webiny/react-composition";
import { PbEditorElement } from "~/types";
import { elementWithChildrenByIdSelector, activeElementAtom, uiAtom } from "../../recoil/modules";
import useUpdateHandlers from "../../plugins/elementSettings/useUpdateHandlers";
import ReactMediumEditor from "../../components/MediumEditor";
import { applyFallbackDisplayMode } from "../../plugins/elementSettings/elementSettingsUtils";

const DATA_NAMESPACE = "data.text";

interface TextElementProps {
    elementId: string;
    mediumEditorOptions?: CoreOptions;
    tag?: string | [string, Record<string, any>];
}

const PeText = makeDecoratable(
    "PeText",
    ({ elementId, mediumEditorOptions, tag: customTag }: TextElementProps) => {
        const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
        const [{ displayMode }] = useRecoilState(uiAtom);
        const [activeElementId, setActiveElementAtomValue] = useRecoilState(activeElementAtom);
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
                setActiveElementAtomValue(elementId);
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

export default PeText;
