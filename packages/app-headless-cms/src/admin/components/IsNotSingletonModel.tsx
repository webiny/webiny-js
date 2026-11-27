import React from "react";
import { isSingletonModel } from "@webiny/app-headless-cms-common";
import { useModel } from "~/admin/components/ModelProvider/index.js";

export interface IsNotSingletonModelProps {
    children: React.ReactNode;
}

export const IsNotSingletonModel = (props: IsNotSingletonModelProps) => {
    const { model } = useModel();

    return isSingletonModel(model) ? null : <>{props.children}</>;
};
