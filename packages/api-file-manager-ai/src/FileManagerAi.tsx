import React from "react";
import { Api } from "@webiny/project-aws";

export const FileManagerAi = () => {
    return (
        <Api.Extension
            src={import.meta.dirname + "/AiImageTaggingApiFeature.js"}
            exportName={"AiImageTaggingApiFeature"}
        />
    );
};
