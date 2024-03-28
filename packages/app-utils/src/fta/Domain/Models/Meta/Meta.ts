export interface MetaDTO {
    totalCount: number;
    cursor: string | null;
    hasMoreItems: boolean;
}

export class Meta {
    public totalCount: number;
    public cursor: string | null;
    public hasMoreItems: boolean;

    protected constructor(meta: MetaDTO) {
        this.totalCount = meta.totalCount;
        this.cursor = meta.cursor;
        this.hasMoreItems = meta.hasMoreItems;
    }

    static create(meta: MetaDTO) {
        return new Meta(meta);
    }

    static createEmpty() {
        return new Meta({
            totalCount: 0,
            cursor: null,
            hasMoreItems: false
        });
    }
}
