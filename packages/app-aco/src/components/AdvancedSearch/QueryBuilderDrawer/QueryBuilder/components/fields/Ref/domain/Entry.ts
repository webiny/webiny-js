export interface EntryDTO {
    id: string;
    entryId: string;
    title: string;
}

export class Entry {
    public id;
    public entryId;
    public title;

    static create(data: EntryDTO) {
        return new Entry(data);
    }

    protected constructor(data: EntryDTO) {
        this.id = data.id;
        this.entryId = data.entryId;
        this.title = data.title;
    }
}
