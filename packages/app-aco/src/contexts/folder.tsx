import React, { createContext } from "react";
import type { FolderDto } from "~/domain/folder/FolderDto.js";

export interface FolderContext {
    folder: FolderDto;
}

export const FolderContext = createContext<FolderContext | undefined>(undefined);

interface FolderProviderProps {
    folder: FolderDto | undefined;
    children: React.ReactNode;
}

export const FolderProvider = ({ folder, children }: FolderProviderProps) => {
    if (!folder) {
        return null;
    }

    const value: FolderContext = { folder };

    return <FolderContext.Provider value={value}>{children}</FolderContext.Provider>;
};
