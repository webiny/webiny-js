import React, { useState } from "react";
import gql from "graphql-tag";
import { OverlayLoader } from "@webiny/admin-ui";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { useQuery } from "@apollo/react-hooks";

const GET_FILE_MODEL = gql`
    query GetFileModel {
        fileManager {
            getFileModel {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

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
