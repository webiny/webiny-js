export interface SortDTO {
    field: string;
    order: "asc" | "desc";
}

export class Sort {
    public field: string;
    public order: "asc" | "desc";

    protected constructor(sort: SortDTO) {
        this.field = sort.field;
        this.order = sort.order;
    }

    static create(sort: SortDTO) {
        return new Sort(sort);
    }
}
