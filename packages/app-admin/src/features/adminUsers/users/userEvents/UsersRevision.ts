import { makeAutoObservable } from "mobx";
import { UsersRevision as Abstraction } from "./abstractions.js";

class UsersRevisionImpl implements Abstraction.Interface {
    list = 0;
    private users = new Map<string, number>();

    constructor() {
        makeAutoObservable(this);
    }

    user(id: string): number {
        return this.users.get(id) ?? 0;
    }

    listChanged(): void {
        this.list++;
    }

    userChanged(id: string): void {
        this.users.set(id, this.user(id) + 1);
    }
}

export const UsersRevision = Abstraction.createImplementation({
    implementation: UsersRevisionImpl,
    dependencies: []
});
