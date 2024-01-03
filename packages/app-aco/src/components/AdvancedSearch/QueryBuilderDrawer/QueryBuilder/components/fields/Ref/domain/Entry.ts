export interface EntryReference {
    id: string;
    entryId: string;
    title: string;
    model: {
        modelId: string;
    };
}

export interface EntryDTO {
    id: string;
    entryId: string;
    title: string;
    modelId: string;
}

export class Entry {
    public id;
    public entryId;
    public title;
    public modelId;

    static create(data: EntryDTO) {
        return new Entry(data);
    }

    protected constructor(data: EntryDTO) {
        this.id = data.id;
        this.entryId = data.entryId;
        this.title = data.title;
        this.modelId = data.modelId;
    }
}
