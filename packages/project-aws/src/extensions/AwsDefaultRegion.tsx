import React from "react";
import { envVar } from "@webiny/project/extensions/envVar.js";

export interface AwsDefaultRegionProps {
    name: string;
}

export const AwsDefaultRegion = (props: AwsDefaultRegionProps) => {
    const EnvVar = envVar.ReactComponent;
    return <EnvVar name="AWS_REGION" value={props.name} />;
};

