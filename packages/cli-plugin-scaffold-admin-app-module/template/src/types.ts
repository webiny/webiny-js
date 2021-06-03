// TODO
export interface TargetItemUserFields {
    title: string;
    description?: string | null;
    isNice?: boolean;
}

export interface TargetItem extends TargetItemUserFields {
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
    data: null | TargetItem[];
}
