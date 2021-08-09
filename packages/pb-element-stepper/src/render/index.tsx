import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import Stepper from "~/render/stepper";

export default () =>
    ({
        type: "pb-render-page-element",
        name: "pb-render-page-element-stepper",
        elementType: "stepper",
        render() {
            return <Stepper />;
        }
    } as PbRenderElementPlugin);
