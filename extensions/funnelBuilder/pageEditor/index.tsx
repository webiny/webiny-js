import React from "react";
import { Stepper } from "./stepper/index.js";
import { FubElementInputs } from "./elementInputs/index.js";
import { FubPageSettings } from "./pageSettings/index.js";

export default () => {
    return (
        <>
            <Stepper />
            <FubElementInputs />
            <FubPageSettings />
        </>
    );
};
