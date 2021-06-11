// TODO
export interface Target_data_modelItemUserFields {
    title: string;
    description?: string | null;
    isNice?: boolean;
}

export interface Target_data_modelItem extends Target_data_modelItemUserFields {
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
    data: null | Target_data_modelItem[];
}
