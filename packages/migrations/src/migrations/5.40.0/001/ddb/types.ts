export interface CreatedBy {
    id: string;
    displayName: string | null;
    type: string;
}

export interface PageBlock {
    id: string;
    name: string;
    blockCategory: string;
    content: any;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
}

export interface ContentElement {
    id: string;
    data: Record<string, any>;
    elements: ContentElement[];
}
