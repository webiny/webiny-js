import { generateAlphaNumericId } from "@webiny/utils";

export class PageElementId {
    private readonly id: string;

    private constructor(id?: string) {
        this.id = id || generateAlphaNumericId(10);
    }

    static create(id?: string) {
        return new PageElementId(id);
    }

    getValue() {
        return this.id;
    }

    toString() {
        return this.id;
    }
}
