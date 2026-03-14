import React from "react";
import { Admin } from "webiny/extensions";

export const FunnelBuilder = () => {
    return (
        <>
            <Admin.Extension src={import.meta.dirname + "/pageType/index.tsx"} />
            <Admin.Extension src={import.meta.dirname + "/stepsNavigator/index.tsx"} />
        </>
    );
};
