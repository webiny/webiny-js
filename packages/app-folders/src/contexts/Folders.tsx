import React, { useState, memo, useMemo } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { FolderItem, ListFoldersResponse } from "~/types";

export const LIST_FOLDERS = gql`
    query ListFolders {
        folders {
            listFolders(where: { type: "page" }) {
                data {
                    id
                    name
                    slug
                    parentId
                }
            }
        }
    }
`;

export interface FoldersContextState {
    folders: FolderItem[];
}

export interface FoldersContextValue {
    state: FoldersContextState;
    setState: (state: Partial<FoldersContextState>) => void;
}

export interface FoldersProviderProps {
    loader?: React.ReactElement;
}

export const FoldersContext = React.createContext<FoldersContextValue>({
    state: {
        folders: []
    },
    setState: () => {
        return void 0;
    }
});

const defaultState: FoldersContextState = { folders: [] };

const FoldersProviderComponent: React.FC<FoldersProviderProps> = props => {
    const { children, loader } = props;
    const [state, setState] = useState<FoldersContextState>(defaultState);
    const { loading } = useQuery<ListFoldersResponse>(LIST_FOLDERS, {
        //skip: state.folders.length > 0,
        onCompleted(data) {
            const { folders } = data?.folders?.listFolders || {};
            setState({ folders });
        }
    });

    if (loading && loader) {
        return loader;
    }

    const value = useMemo(
        (): FoldersContextValue => ({
            state,
            setState: (newState: Partial<FoldersContextState>) => {
                return setState(prev => {
                    return {
                        ...prev,
                        ...newState
                    };
                });
            }
        }),
        [state]
    );

    return <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>;
};

export const FoldersProvider: React.FC<FoldersProviderProps> = memo(FoldersProviderComponent);
