type PublicAccess = {
    type: "public";
};

type PrivateAuthenticatedAccess = {
    type: "private-authenticated";
};

export interface File {
    id: string;
    key: string;
    size: number;
    type: string;
    name: string;
    meta: Record<string, any>;
    accessControl?: PublicAccess | PrivateAuthenticatedAccess;
    location: {
        folderId: string;
    };
    tags: string[];
    aliases: string[];

    createdOn: string;
    modifiedOn: string | null;
    savedOn: string;
    createdBy: CreatedBy;
    modifiedBy: CreatedBy | null;
    savedBy: CreatedBy;
    extensions?: Record<string, any>;

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
