import type { IUniqueResolver } from "./abstractions/UniqueResolver";
import type { GenericRecord } from "@webiny/api/types";

export class UniqueResolver<T extends GenericRecord> implements IUniqueResolver<T> {
    private readonly resolved = new Set<keyof T>();

    public resolve(input: T[], field: keyof T): T[] {
        return input.reduce<T[]>((assets, asset) => {
            const value = asset[field];
            if (this.resolved.has(value)) {
                return assets;
            }
            this.resolved.add(value);
            assets.push(asset);
            return assets;
        }, []);
    }
}
