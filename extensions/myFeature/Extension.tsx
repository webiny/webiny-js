import React from "react";
import { Api } from "webiny/extensions";

export const MyFeature = () => {
    return (
        <>
            <Api.Extension src={"@/extensions/myFeature/MyFeature.ts"} />
            <Api.Extension src={"@/extensions/myFeature/MyGraphQLSchema.ts"} />
        </>
    );
};
