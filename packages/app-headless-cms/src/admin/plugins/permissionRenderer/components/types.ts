export interface OnChangeCallable {
    (id: string | number): () => void;
}
export interface GetValueCallable {
    (id: string | number): boolean;
}
export interface PermissionSelectorCmsModel {
    id: string;
    label: string;
    [key: string]: any;
}

export interface PermissionSelectorCmsGroup {
    id: string;
    label: string;
    [key: string]: any;
}
