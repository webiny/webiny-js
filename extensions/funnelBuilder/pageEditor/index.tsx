import React from "react";
import { StepsNavigator } from "./stepsNavigator/index.js";
import { FubElementInputs } from "./elementInputs/index.js";
import { FubPageSettings } from "./pageSettings/index.js";

export default () => {
    return (
        <>
            <StepsNavigator />
            <FubElementInputs />
            <FubPageSettings />
        </>
    );
};
