import React, { useMemo } from "react";
import get from "lodash/get";
import classNames from "classnames";
import { useCurrentElement } from "@webiny/app-page-builder/editor/hooks/useCurrentElement";
import { useUI } from "@webiny/app-page-builder/editor/hooks/useUI";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { applyFallbackDisplayMode } from "@webiny/app-page-builder/editor/plugins/elementSettings/elementSettingsUtils";
import { makeComposable } from "@webiny/app-admin";
import { LexicalEditor } from "./LexicalEditor";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";
const DATA_NAMESPACE = "data.text";

interface TextElementProps {
    elementId: string;
    rootClassName?: string;
}

const PbText = makeComposable<TextElementProps>("PbText", ({ rootClassName }) => {
    const { element } = useCurrentElement();
    const [{ displayMode }] = useUI();

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);

    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }

    const tag = get(value, "tag");
    const typography = get(value, "typography");

    return (
        <ElementRoot
            element={element}
            className={classNames(textClassName, rootClassName, typography)}
        >
            <LexicalEditor
                tag={tag}
                value={null}
                onChange={json => {
                    console.log(json);
                }}
            />
        </ElementRoot>
    );
});

export default React.memo(PbText);
