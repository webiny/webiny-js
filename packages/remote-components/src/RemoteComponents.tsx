import React from "react";
import { Api, Admin } from "@webiny/project-aws";
import { FeatureFlag } from "@webiny/project";

export const RemoteComponents = () => {
    return (
        <FeatureFlag.CanUseRemoteComponents>
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </FeatureFlag.CanUseRemoteComponents>
    );
};
