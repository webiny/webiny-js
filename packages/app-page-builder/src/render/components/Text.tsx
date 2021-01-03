import React, { useMemo } from "react";
import classNames from "classnames";
import get from "lodash/get";
import { usePageBuilder } from "../../hooks/usePageBuilder";
import { DisplayMode, PbElement } from "../../types";
import { ElementRoot } from "./ElementRoot";
import { applyFallbackDisplayMode } from "../../editor/plugins/elementSettings/elementSettingsUtils";

const DATA_NAMESPACE = "data.text";

type TextPropsType = {
    element: PbElement;
    rootClassName?: string;
};
const TextElement: React.FunctionComponent<TextPropsType> = ({ element, rootClassName }) => {
    const {
        responsiveDisplayMode: { displayMode }
    } = usePageBuilder();

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode as DisplayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);
    const textContent = get(element, `${DATA_NAMESPACE}.data.text`);
    const tag = get(value, "tag");
    const typography = get(value, "typography");

    return (
        <ElementRoot element={element} className={classNames(className, rootClassName, typography)}>
            {React.createElement(tag, {
                dangerouslySetInnerHTML: { __html: textContent }
            })}
        </ElementRoot>
    );
};

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

export default React.memo(TextElement);
