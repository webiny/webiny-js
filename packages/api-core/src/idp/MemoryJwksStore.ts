import { JwksStore as Abstraction } from "./abstractions.js";

class MemoryJwksStoreImpl implements Abstraction.Interface {
    private readonly entries = new Map<string, Abstraction.Entry>();

    public get(issuer: string): Abstraction.Entry | undefined {
        return this.entries.get(issuer);
    }

    public set(issuer: string, entry: Abstraction.Entry): void {
        this.entries.set(issuer, entry);
    }
}

export const MemoryJwksStore = Abstraction.createImplementation({
    implementation: MemoryJwksStoreImpl,
    dependencies: []
});
