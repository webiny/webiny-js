import React from "react";
import { Api } from "@webiny/project-aws/api.js";
import { Admin } from "@webiny/project-aws/admin.js";

/*
 * Not wrapped in a `FeatureFlag` component: those read the license when the project is built, so a
 * license that gained languages after the last deploy did nothing until the next one, while Website
 * Builder's checks already read the live license. Both extensions gate themselves on the
 * `languages` flag instead, the same way AI Powerups does.
 */
export const Languages = () => {
    return (
        <>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
