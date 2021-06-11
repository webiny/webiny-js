// TODO
export interface CarManufacturerItemUserFields {
    title: string;
    description?: string | null;
    isNice?: boolean;
}

export interface CarManufacturerItem extends CarManufacturerItemUserFields {
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
    data: null | CarManufacturerItem[];
}
