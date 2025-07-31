import { generateId } from "~/utils";

export class TagItem {
    private readonly _id: string;
    private readonly _label: string;
    protected _protected: boolean;

    protected constructor(data: { id: string; label: string; protected: boolean }) {
        this._id = data.id;
        this._label = data.label;
        this._protected = data.protected;
    }

    static create(data: { id?: string; label: string; protected?: boolean }): TagItem {
        return new TagItem({
            id: generateId(data.id),
            label: data.label,
            protected: data.protected || false
        });
    }

    get id() {
        return this._id;
    }

    get label() {
        return this._label;
    }

    get protected() {
        return this._protected;
    }
}
