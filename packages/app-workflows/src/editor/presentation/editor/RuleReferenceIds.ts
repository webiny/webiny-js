// A folder a rule holds: the id and the folder `type` it was saved with (`folderExists` needs it).
export interface RuleFolderRef {
    id: string;
    type: string;
}

// The distinct ids the rules of the open workflow reference (R298).
export interface RuleReferenceIds {
    userIds: string[];
    teamIds: string[];
    folders: RuleFolderRef[];
}
