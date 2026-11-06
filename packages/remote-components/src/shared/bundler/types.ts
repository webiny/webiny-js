export interface ComponentSource {
    name: string;
    source: string;
    css?: string;
}

/**
 * An input's name and, for object inputs, the names of its fields. Enough to tell whether a manifest
 * declares the inputs a source declares.
 */
export interface InputOutline {
    name: string;
    fields: InputOutline[];
}
