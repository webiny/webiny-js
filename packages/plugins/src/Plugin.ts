export abstract class Plugin {
    public static readonly type: string;
    private _name: string;

    constructor() {
        if (!this.type) {
            throw Error(`Missing "type" definition in "${this.constructor.name}"!`);
        }
    }

    get name() {
        return this._name;
    }

    set name(value) {
        this._name = value;
    }

    get type() {
        return (this.constructor as typeof Plugin).type;
    }
}
