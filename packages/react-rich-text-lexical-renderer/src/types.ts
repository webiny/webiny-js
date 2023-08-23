import { CSSObject } from "@emotion/react";
import React from "react";
import { StylesObject, ThemeBreakpoints } from "@webiny/theme/types";

export type AttributesObject = React.ComponentProps<any>;

interface SetAssignStylesCallbackParams {
    breakpoints: ThemeBreakpoints;
    styles: StylesObject;
    assignTo?: CSSObject;
}

interface SetAssignAttributesCallbackParams {
    attributes: AttributesObject;
    assignTo?: AttributesObject;
}

export type AssignAttributesCallback = (
    params: SetAssignAttributesCallbackParams
) => AttributesObject;
export type AssignStylesCallback = (params: SetAssignStylesCallbackParams) => CSSObject;
