export interface TargetDataModelItemUserFields {
    title: string;
    description?: string | null;
}

export interface TargetDataModelItem extends TargetDataModelItemUserFields {
    id: string;
    createdOn: Date;
    savedOn: Date;
    createdBy: {
        id: string;
        displayName: string;
        type: string;
    };
}

export interface DataListChildProps {
    data: null | TargetDataModelItem[];
}
