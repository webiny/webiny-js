import React, { useState } from "react";
import { OverlayLoader } from "@webiny/admin-ui";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { useQuery } from "@apollo/client/react";
import { GET_FILE_MODEL } from "~/modules/FileManagerApiProvider/graphql.js";

export const FileModelContext = React.createContext<CmsModel | undefined>(undefined);

export const FileModelProvider = ({ children }: { children: React.ReactNode }) => {
    const [model, setModel] = useState<CmsModel | undefined>(undefined);

    useQuery(GET_FILE_MODEL, {
        onCompleted: data => {
            setModel(data.fileManager.getFileModel.data);
        }
    });

    if (!model) {
        return <OverlayLoader text={"Preparing File Manager..."} />;
    }

    return <FileModelContext.Provider value={model}>{children}</FileModelContext.Provider>;
};
