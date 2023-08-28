export interface Field {
    id: string;
    type: string;
    label: string;
    settings: {
        modelIds: string[];
    };
}
