export type FolderAccessLevel = "owner" | "viewer" | "editor" | "public" | "no-access";

export interface FolderPermission {
    target: `admin:${string}` | `team:${string}`;
    level: FolderAccessLevel;
    inheritedFrom?: string;
    /**
     * Set on permissions contributed from code, via an `FlpFactory`. These are merged into the FLP
     * record on read, never persisted, and cannot be modified via the API or the Admin UI.
     */
    plugin?: boolean;
}

export interface FolderLevelPermission {
    id: string;
    parentId: string;
    slug: string;
    path: string;
    permissions: FolderPermission[];
    type: string;
}
