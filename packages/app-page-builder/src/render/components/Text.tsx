import React, { useMemo } from "react";
import classNames from "classnames";
import get from "lodash/get";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { DisplayMode, PbElement } from "~/types";
import { ElementRoot } from "./ElementRoot";
import { applyFallbackDisplayMode } from "~/editor/plugins/elementSettings/elementSettingsUtils";

const DATA_NAMESPACE = "data.text";

interface TextPropsType {
    element: PbElement;
    rootClassName?: string;
}
const TextElement: React.FC<TextPropsType> = ({ element, rootClassName }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = usePageBuilder();

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(
                displayMode as DisplayMode,
                mode => get(element, `${DATA_NAMESPACE}.${mode}`) as unknown as string
            ),
        [displayMode]
    );

    const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);
    const textContent = get(element, `${DATA_NAMESPACE}.data.text`);
    const tag = get(value, "tag") as unknown as string;
    const typography = get(value, "typography");

    return (
        <ElementRoot element={element} className={classNames(className, rootClassName, typography)}>
            {React.createElement(tag === "p" ? "div" : tag, {
                dangerouslySetInnerHTML: { __html: textContent }
            })}
        </ElementRoot>
    );
};

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

export default React.memo(TextElement);
