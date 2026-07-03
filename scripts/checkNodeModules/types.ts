export interface NestedPackage {
    name: string;
    version: string;
    parentPackage: string;
    depth: number;
}

export interface DuplicateGroup {
    packageName: string;
    rootVersion: string | null;
    nested: Array<{
        version: string;
        parents: string[];
    }>;
}

export interface WorkspaceViolation {
    workspace: string;
    packageName: string;
    version: string;
}
