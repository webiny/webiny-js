import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import { ProcessOwner } from "~/process/ProcessOwner.js";

/**
 * The host and pid make the id readable when someone looks at it in the database. The random part
 * makes it unique: a pid is reused after a restart, and containers often all run as pid 1.
 */
class RandomProcessOwnerImpl implements ProcessOwner.Interface {
    public readonly id: string;

    public constructor() {
        const suffix = randomUUID().slice(0, 8);
        this.id = `${hostname()}:${process.pid}:${suffix}`;
    }
}

export const RandomProcessOwner = ProcessOwner.createImplementation({
    implementation: RandomProcessOwnerImpl,
    dependencies: []
});
