import React from "react";
import { Api } from "webiny/extensions";

export const MySchemaExtension = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/MyGraphQLSchema.ts"} />
        </>
    );
};
