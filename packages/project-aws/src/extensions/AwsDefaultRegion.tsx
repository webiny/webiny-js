import React from "react";
import { EnvVar } from "@webiny/project/extensions/index.js";

export interface AwsDefaultRegionProps {
    name: string;
}

export const AwsDefaultRegion = (props: AwsDefaultRegionProps) => {
    return <EnvVar varName="AWS_REGION" value={props.name} />;
};
