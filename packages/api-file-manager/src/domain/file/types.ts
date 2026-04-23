export type PublicAccess = {
    type: "public";
};

export type PrivateAuthenticatedAccess = {
    type: "private-authenticated";
};

export type FileAccess = PublicAccess | PrivateAuthenticatedAccess;

export interface CreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface File {
    id: string;
    key: string;
    size: number;
    type: string;
    name: string;
    metadata: Record<string, any>;
    accessControl?: FileAccess;
    location: {
        folderId: string;
    };
    tags: string[];
    description: string;
    createdOn: string;
    modifiedOn: string | undefined;
    savedOn: string;
    createdBy: CreatedBy;
    modifiedBy: CreatedBy | undefined;
    savedBy: CreatedBy;
    extensions?: Record<string, any>;
}

export interface FileInput {
    id: string;

    // Entry-level fields (we don't use revisions for files)
    createdOn?: string;
    modifiedOn?: string;
    savedOn?: string;
    createdBy?: CreatedBy;
    modifiedBy?: CreatedBy;
    savedBy?: CreatedBy;

    key: string;
    name: string;
    size: number;
    type: string;
    metadata: Record<string, any>;
    location?: {
        folderId: string;
    };
    tags: string[];
    description?: string;
    extensions?: Record<string, any>;
}
