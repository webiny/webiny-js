import React, { useMemo } from "react";
import classNames from "classnames";
import get from "lodash/get";
import { usePageElements } from "~/hooks/usePageElements";
import { Element } from "~/types";
import { ElementRoot } from "./ElementRoot";
import { applyFallbackbreakpoint } from "~/utils/applyFallbackbreakpoint";

const DATA_NAMESPACE = "data.text";

type TextPropsType = {
    element: Element;
    rootClassName?: string;
};
const TextElement: React.FunctionComponent<TextPropsType> = ({ element, rootClassName }) => {
    const {
        breakpoints,
        responsivebreakpoint: { breakpoint }
    } = usePageElements();

    const fallbackValue = useMemo(
        () =>
            applyFallbackbreakpoint({
                breakpoint,
                breakpoints,
                getValue: mode => get(element, `${DATA_NAMESPACE}.${mode}`)
            }),
        [breakpoint]
    );

    const value = get(element, `${DATA_NAMESPACE}.${breakpoint}`, fallbackValue);
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
