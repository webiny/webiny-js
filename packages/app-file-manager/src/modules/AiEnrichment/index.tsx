import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { AiEnrichmentFeature } from "./feature.js";

export const AiEnrichmentModule = () => {
    return <RegisterFeature feature={AiEnrichmentFeature} />;
};
