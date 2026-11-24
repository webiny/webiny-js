import React from "react";
import { ApiExtension } from "@webiny/project/extensions/index.js";
import { AdminExtension } from "@webiny/project/extensions/index.js";

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
            <ApiExtension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <AdminExtension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
