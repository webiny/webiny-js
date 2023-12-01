export interface File {
    id: string;
    key: string;
    size: number;
    type: string;
    name: string;
    meta: Record<string, any>;
    location: {
        folderId: string;
    };
    tags: string[];
    aliases: string[];
    createdOn: string;
    savedOn: string;
    createdBy: CreatedBy;
    modifiedBy?: CreatedBy | null;
    /**
     * Added with new storage operations refactoring.
     */
    tenant: string;
    locale: string;
    webinyVersion: string;
    /**
     * User can add new fields to the File object, so we must allow it in the types.
     */
    [key: string]: any;
}

export interface FileAlias {
    tenant: string;
    locale: string;
    fileId: string;
    alias: string;
}

export interface CreatedBy {
    id: string;
    displayName: string | null;
    type: string;
}
