import { createIdentifier, parseIdentifier } from "@webiny/utils";
import { mdbid } from "@webiny/utils/mdbid.js";

export class EntryId {
    private constructor(
        private _id: string,
        private _version: number
    ) {}

    static create() {
        return new EntryId(mdbid(), 1);
    }

    static from(value: string) {
        const { id, version } = parseIdentifier(value);
        return new EntryId(id, version ?? 1);
    }

    toString() {
        return createIdentifier({ id: this.id, version: this.version });
    }

    get id() {
        return this._id;
    }

    get version() {
        return this._version;
    }

    incrementVersion() {
        return new EntryId(this._id, this._version + 1);
    }

    decrementVersion() {
        const version = this._version > 1 ? this._version - 1 : 1;

        return new EntryId(this._id, version);
    }

    setVersion(version: number) {
        if (isNaN(version)) {
            throw Error(`Version must be a number.`);
        }

        if (version < 1) {
            throw Error(`Version must be greater than 0.`);
        }
        return new EntryId(this._id, version);
    }
}
