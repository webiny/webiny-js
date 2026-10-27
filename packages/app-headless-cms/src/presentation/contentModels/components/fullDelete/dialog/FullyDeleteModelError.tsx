import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Alert } from "@webiny/admin-ui";
import type { CmsErrorResponse, CmsModel } from "~/types.js";

export interface FullyDeleteModelErrorProps {
    model: CmsModel;
    error: CmsErrorResponse;
}

/*
 * The error a refused model delete ends with. Decoratable, so a package that blocks the delete
 * (for example a workflow bound to the model) can explain its own refusal.
 */
export const FullyDeleteModelError = makeDecoratable(
    "FullyDeleteModelError",
    (props: FullyDeleteModelErrorProps) => {
        return <Alert type={"danger"}>{props.error.message}</Alert>;
    }
);
