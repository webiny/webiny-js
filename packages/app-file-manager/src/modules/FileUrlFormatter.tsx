import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { FileUrlFormatterFeature } from "~/features/fileUrlFormatter/feature.js";

export const FileUrlFormatterModule = () => {
    return <RegisterFeature feature={FileUrlFormatterFeature} />;
};
