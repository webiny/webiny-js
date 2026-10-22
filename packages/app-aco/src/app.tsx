import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { FolderModelProviderModule } from "~/features/folders/folderModelProvider/FolderModelContext.js";
import { FolderEventsFeature } from "~/features/folders/folderEvents/index.js";

export const AdvancedContentOrganisation = () => {
    return (
        <>
            <FolderModelProviderModule />
            <RegisterFeature feature={FolderEventsFeature} />
        </>
    );
};
