import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { FolderModelProviderModule } from "~/features/folders/folderModelProvider/FolderModelContext.js";
import { FilterRepositoryFeature } from "~/features/filterRepository/index.js";

export const AdvancedContentOrganisation = () => {
    return (
        <>
            <RegisterFeature feature={FilterRepositoryFeature} />
            <FolderModelProviderModule />
        </>
    );
};
