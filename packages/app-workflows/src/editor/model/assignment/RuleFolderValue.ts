// A rule's folder condition as stored. `type` is `cms:<modelId>` or `wb:page`; a foreign type stays as stored (R295).
export interface RuleFolderValue {
    id: string;
    type: string;
    includeDescendants: boolean;
}
