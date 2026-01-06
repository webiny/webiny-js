import React from "react";
import { Api } from "webiny/extensions.js";

export const Extension = () => {
    return (
        <>
            <Api.Extension src={import.meta.dirname + "/AiWriterGraphQLSchema.ts"} />
        </>
    );
};
