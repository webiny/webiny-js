export type PublicAccess = {
    type: "public";
};

export type PrivateAuthenticatedAccess = {
    type: "private-authenticated";
};

export type FileAccess = PublicAccess | PrivateAuthenticatedAccess;

export interface CreatedBy {
    id: string;
    displayName: string | null;
    type: string;
}

export interface File {
    id: string;
    key: string;
    size: number;
    type: string;
    name: string;
    meta: Record<string, any>;
    accessControl?: FileAccess;
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

    tenant: string;
    webinyVersion: string;
}

export interface FileAlias {
    tenant: string;
    fileId: string;
    alias: string;
}

export interface FileInput {
    id: string;

    // Entry-level fields (we don't use revisions for files)
    createdOn?: string | Date;
    modifiedOn?: string | Date;
    savedOn?: string | Date;
    createdBy?: CreatedBy;
    modifiedBy?: CreatedBy;
    savedBy?: CreatedBy;

    key: string;
    name: string;
    size: number;
    type: string;
    meta: Record<string, any>;
    location?: {
        folderId: string;
    };
    tags: string[];
    aliases: string[];
    extensions?: Record<string, any>;
}
