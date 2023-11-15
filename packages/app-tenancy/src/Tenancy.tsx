import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import installation from "./plugins/installation";

export const TenancyExtension: React.FC = () => {
    plugins.register(installation);

    return null;
};

export const Tenancy = memo(TenancyExtension);
