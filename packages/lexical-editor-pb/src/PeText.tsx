import React, { useEffect, useMemo } from "react";
import get from "lodash/get";
import { makeComposable } from "@webiny/app-admin";
import { LexicalEditor } from "./LexicalEditor";
import { useRecoilState, useRecoilValue } from "recoil";
import {
    activeElementAtom,
    elementWithChildrenByIdSelector,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { applyFallbackDisplayMode } from "@webiny/app-page-builder/editor/plugins/elementSettings/elementSettingsUtils";
import { CoreOptions } from "medium-editor";

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

        const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);

        // required due to re-rendering when set content atom and still nothing in elements atom
        if (!element) {
            return null;
        }

        const tag = customTag || get(value, "tag");

        return (
            <LexicalEditor
                tag={tag}
                value={null}
                onChange={json => {
                    console.log(json);
                }}
            />
        );
    }
);
