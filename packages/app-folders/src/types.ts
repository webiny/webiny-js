export interface FolderItem {
    id: string;
    name: string;
    slug: string;
    type: string;
    parentId?: string;
}

export interface ListFoldersResponse {
    folders: {
        listFolders: {
            folders: FolderItem[];
        };
    };
}

export interface DndItem {
    id: string;
    parent: string | number;
    text: string;
    droppable: boolean;
}
