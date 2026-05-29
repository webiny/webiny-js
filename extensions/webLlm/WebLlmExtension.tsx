import React from "react";
import { Admin } from "webiny/extensions";

export const WebLlmExtension = () => {
    return <Admin.Extension src={import.meta.dirname + "/admin/Extension.tsx"} />;
};
