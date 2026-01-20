import React from "react";
import { Api } from "webiny/extensions";

const MySchemaExtension = () => {
    return (
        <>
            <Api.Extension src={"/extensions/graphql/MyGraphQLSchema.ts"} />
        </>
    );
};

export default MySchemaExtension;
