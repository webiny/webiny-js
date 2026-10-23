import { useContext } from "react";
import { StepFormOptionsContext } from "./StepFormOptionsContext.js";
import type { StepFormOptions } from "./StepFormOptions.js";

export const useStepFormOptions = (): StepFormOptions => {
    const options = useContext(StepFormOptionsContext);
    if (options === null) {
        throw new Error("useStepFormOptions must be used inside the step drawer.");
    }
    return options;
};
