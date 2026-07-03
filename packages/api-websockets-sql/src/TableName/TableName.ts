import { TableName as TableNameAbstraction } from "~/TableName/abstractions.js";

export class TableName implements TableNameAbstraction.Interface {
    private readonly prefix;

    public constructor(prefix?: string) {
        this.prefix = prefix;
    }

    public resolve(name: string): string {
        if (!this.prefix) {
            return name;
        }
        return `${this.prefix}_${name}`;
    }
}
