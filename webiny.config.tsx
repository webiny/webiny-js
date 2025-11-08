import React from "react";
// Note: in a real project, these would be imported from `@webiny/extensions`
import { Admin, Cli, Infra } from "./packages/project-aws/dist/index.js";

// import { Okta } from "@webiny/okta";

export default () => {
    return (
        <>
            <Infra.PulumiResourceNamePrefix prefix={"myproj-"} />
        </>
    );
};
