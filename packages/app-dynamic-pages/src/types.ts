// Element styles copied from app-page-builder for now
// because it creates import loop when importing from that package
export interface PbElement {
    id: string;
    type: string;
    data: any;
    elements: PbElement[];
    content?: PbElement;
    text?: string;
}

export interface PbEditorElement {
    id: string;
    type: string;
    data: any;
    parent?: string;
    elements: (string | PbEditorElement)[];
    content?: PbEditorElement;
    path?: string[];
    source?: string;

    [key: string]: any;
}
