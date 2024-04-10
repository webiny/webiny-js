export interface SortingDTO {
    field: string;
    order: "asc" | "desc";
}

export class Sorting {
    public field: string;
    public order: "asc" | "desc";

    protected constructor(sorting: SortingDTO) {
        this.field = sorting.field;
        this.order = sorting.order;
    }

    static create(sorting: SortingDTO) {
        return new Sorting(sorting);
    }
}
