import React, { useState } from "react";
import { CmsModel } from "@webiny/app-headless-cms/types";
import { useQuery } from "@apollo/react-hooks";
import { GET_FILE_MODEL } from "~/modules/FileManagerApiProvider/graphql";
import { CircularProgress } from "@webiny/ui/Progress";

export const FileModelContext = React.createContext<CmsModel | undefined>(undefined);

export const FileModelProvider = ({ children }: { children: React.ReactNode }) => {
    const [model, setModel] = useState<CmsModel | undefined>(undefined);

    useQuery(GET_FILE_MODEL, {
        onCompleted: data => {
            setModel(data.fileManager.getFileModel.data);
        }
    });

    if (!model) {
        return <CircularProgress label={"Preparing File Manager..."} />;
    }

    return <FileModelContext.Provider value={model}>{children}</FileModelContext.Provider>;
};
