import React, { useState, useMemo, Dispatch, SetStateAction } from "react";

import { Types } from "~/types";

export interface FoldersContext {
    folderType: keyof Types | null;
    setFolderType: Dispatch<SetStateAction<keyof Types | null>>;
}

export const FoldersContext = React.createContext<FoldersContext>({
    folderType: null,
    setFolderType: () => {
        return void 0;
    }
});

export const FoldersProvider: React.FC = props => {
    const [folderType, setFolderType] = useState<keyof Types | null>(null);

    const value = useMemo(() => {
        return {
            folderType,
            setFolderType
        };
    }, [folderType]);

    return <FoldersContext.Provider value={value}>{props.children}</FoldersContext.Provider>;
};
