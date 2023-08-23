// Detect if we're working with a per-breakpoint object, or just a set of regular CSS properties.
import { StylesObject, ThemeBreakpoints } from "@webiny/theme/types";
import { AssignStylesCallback } from "~/types";
import { CSSObject } from "@emotion/react";

export const isPerBreakpointStylesObject = ({
    breakpoints,
    styles
}: {
    breakpoints: ThemeBreakpoints;
    styles: StylesObject;
}): boolean => {
    for (const breakpointName in breakpoints) {
        if (styles[breakpointName]) {
            return true;
        }
    }
    return false;
};

export const assignStyles: AssignStylesCallback = (params: {
    breakpoints: ThemeBreakpoints;
    styles: StylesObject;
    assignTo?: CSSObject;
}) => {
    const { breakpoints, styles = {}, assignTo = {} } = params;
    if (isPerBreakpointStylesObject({ breakpoints, styles })) {
        for (const breakpointName in breakpoints) {
            const breakpoint = breakpoints[breakpointName];
            if (styles && styles[breakpointName]) {
                if (!assignTo[breakpoint]) {
                    assignTo[breakpoint] = {};
                }
                /**
                 * We must cast because it breaks on TS 4.7.4.
                 * Object is not undefined, so it is safe.
                 */
                Object.assign(assignTo[breakpoint] as CSSObject, styles[breakpointName]);
            }
        }
    } else {
        Object.assign(assignTo, styles);
    }

    return assignTo;
};
