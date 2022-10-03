import React, { useState, useMemo, Dispatch, SetStateAction } from "react";

export interface FoldersContext {
    folderType: string | null;
    setFolderType: Dispatch<SetStateAction<string | null>>;
}

export const FoldersContext = React.createContext<FoldersContext | undefined>(undefined);

export const FoldersProvider: React.FC = props => {
    const [folderType, setFolderType] = useState<string | null>(null);

    const value = useMemo(() => {
        return {
            folderType, //NO
            setFolderType //NO
            // listFolders: (type: string) => {
            //     // return list of folders by type
            // },
            // createFolder,
            // updateFolder
        };
    }, [folderType]);

    return <FoldersContext.Provider value={value}>{props.children}</FoldersContext.Provider>;
};
