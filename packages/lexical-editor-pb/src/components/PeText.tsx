import React, { useCallback, useEffect, useMemo } from "react";
import get from "lodash/get";
import { makeComposable } from "@webiny/app-admin";
import { useRecoilState, useRecoilValue } from "recoil";
import {
    activeElementAtom,
    elementWithChildrenByIdSelector,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { applyFallbackDisplayMode } from "@webiny/app-page-builder/editor/plugins/elementSettings/elementSettingsUtils";
import { CoreOptions } from "medium-editor";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import { DelayedOnChange } from "@webiny/ui/DelayedOnChange";
import { LexicalEditor } from "~/LexicalEditor";

const DATA_NAMESPACE = "data.text";

interface TextElementProps {
    elementId: string;
    mediumEditorOptions?: CoreOptions;
    tag?: string | [string, Record<string, any>];
}

export const PeText = makeComposable<TextElementProps>(
    "PeText",
    ({ elementId, tag: customTag }) => {
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

        useEffect(() => {
            if (elementId && activeElementId !== elementId) {
                setActiveElementAtomValue(elementId);
            }
        }, [activeElementId, elementId]);

        const onChange = useCallback(
            value => {
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
                {({ value, onChange }) => (
                    <LexicalEditor tag={tag} value={value} onChange={onChange} />
                )}
            </DelayedOnChange>
        );
    }
);
