export interface FmIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface FmLocation {
    folderId: string;
}

export interface FmFile_Metadata {
    image?: {
        width?: number;
        height?: number;
        format?: string;
        orientation?: number;
    };
    exif?: Record<string, any>;
    iptc?: Record<string, any>;
    [key: string]: any;
}

export type FmFile_AccessControl = {
    type: "public" | "private-authenticated";
};

export interface FmFile {
    id: string;
    createdOn: Date | string;
    modifiedOn?: Date | string;
    savedOn: Date | string;
    createdBy: FmIdentity;
    modifiedBy?: FmIdentity;
    savedBy: FmIdentity;
    location: FmLocation;
    src: string;
    name: string;
    key: string;
    type: string;
    size: number;
    metadata: FmFile_Metadata;
    tags: string[];
    accessControl?: FmFile_AccessControl;
    [key: string]: any;
}

export interface FmTag {
    tag: string;
    count: number;
}

export interface FmListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface FmLocationInput {
    folderId: string;
}

export interface FmLocationWhereInput {
    folderId?: string;
    folderId_in?: string[];
    folderId_not?: string;
    folderId_not_in?: string[];
}

export interface FmFileListWhereInput {
    location?: FmLocationWhereInput;
    name?: string;
    name_contains?: string;
    name_not_contains?: string;
    type?: string;
    type_in?: string[];
    type_not?: string;
    type_not_in?: string[];
    tags?: string[];
    tags_in?: string[];
    tags_not?: string;
    tags_not_in?: string[];
    AND?: FmFileListWhereInput[];
    OR?: FmFileListWhereInput[];
}

export enum FmFileListSorter {
    SAVED_ON_ASC = "savedOn_ASC",
    SAVED_ON_DESC = "savedOn_DESC",
    CREATED_ON_ASC = "createdOn_ASC",
    CREATED_ON_DESC = "createdOn_DESC",
    NAME_ASC = "name_ASC",
    NAME_DESC = "name_DESC",
    KEY_ASC = "key_ASC",
    KEY_DESC = "key_DESC",
    TYPE_ASC = "type_ASC",
    TYPE_DESC = "type_DESC",
    SIZE_ASC = "size_ASC",
    SIZE_DESC = "size_DESC"
}

export interface FmTagsListWhereInput {
    createdBy?: string;
    tags_startsWith?: string;
    tags_not_startsWith?: string;
}

export interface UploadProgress {
    sent: number;
    total: number;
    percentage: number;
}

export interface PresignedPostPayload {
    url: string;
    fields: Record<string, string>;
}

export interface PresignedPostPayloadResponse {
    data: PresignedPostPayload;
    file: {
        id: string;
        name: string;
        type: string;
        size: number;
        key: string;
    };
}

export enum BatchUploadStrategy {
    FAIL_FAST = "fail-fast",
    CONTINUE = "continue"
}
