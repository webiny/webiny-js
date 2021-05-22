export abstract class Plugin {
    private _name: string;
    private _type: string;

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get type() {
        return this._type;
    }

    set type(value) {
        if (!this._type) {
            this._type = value;
        }
    }
}
