import React from "react";
import { Webiny } from "@webiny/project-aws/extensions/Webiny.js";
import { Extensions as WebinyConfigTsx } from "../../webiny.config.js";

export const Extensions = () => {
    return (
        <>
            <Webiny />
            <WebinyConfigTsx />
        </>
    );
};
