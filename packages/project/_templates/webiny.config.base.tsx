import React from "react";
import { Webiny } from "@webiny/project-aws/extensions/Webiny.js";
import WebinyConfigTsx from "../../webiny.config.js";

export default function WebinyConfigBase() {
    return (
        <>
            <Webiny />
            <WebinyConfigTsx />
        </>
    );
}
