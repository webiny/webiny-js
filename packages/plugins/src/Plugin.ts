export abstract class Plugin {
    public static readonly type: string;
    public name?: string;

    constructor() {
        if (!(this.constructor as typeof Plugin).type) {
            throw Error(`Missing "type" definition in "${this.constructor.name}"!`);
        }
    }

    get type() {
        return (this.constructor as typeof Plugin).type;
    }
}
