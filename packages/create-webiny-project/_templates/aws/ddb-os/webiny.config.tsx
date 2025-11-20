import React from "react";
import { Infra } from "webiny/extensions";

export default () => {
    return (
        <>
            <Infra.OpenSearch enabled={true} />
        </>
    );
};
