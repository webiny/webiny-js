import React from "react";
import { Admin, Api } from "webiny/extensions";

export const CmsRevisionCompareExtension = () => (
    <>
        <Api.Extension src={import.meta.dirname + "/api/Extension.ts"} />
        <Admin.Extension src={import.meta.dirname + "/admin/Extension.tsx"} />
    </>
);
