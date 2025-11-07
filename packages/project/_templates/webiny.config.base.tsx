import React from "react";
import PublicWebinyConfigTsx from "../../webiny.config.js";
import { Webiny } from "@webiny/project-aws/extensions/Webiny.js";

export default () => {
    return (
        <>
            <Webiny />
            <PublicWebinyConfigTsx />
        </>
    );
};
