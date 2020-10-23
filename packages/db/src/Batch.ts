import Db from "./Db";
import { CrudArgs } from "./types";
type OperationType = "create" | "read" | "update" | "delete";
type Operation = [OperationType, CrudArgs];

class Batch {
    db: Db;
    type: "batch" | "transaction";
    id: string;
    meta: Record<string, any>;
    operations: Operation[];
    constructor(db) {
        this.db = db;
        this.type = "batch";
        this.id = Math.random()
            .toString(36)
            .slice(-6); // e.g. tfz58m

        this.meta = {};
        this.operations = [];
    }

    push(...operations: Operation[]) {
        for (let i = 0; i < operations.length; i++) {
            const item = operations[i];
            this.operations.push(item);
        }
    }

    create(...args: CrudArgs[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["create", args[i]]);
        }
    }

    read(...args: CrudArgs[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["read", args[i]]);
        }
    }

    update(...args: CrudArgs[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["update", args[i]]);
        }
    }

    delete(...args: CrudArgs[]) {
        for (let i = 0; i < args.length; i++) {
            this.push(["delete", args[i]]);
        }
    }

    async execute() {
        const promises = [];
        for (let i = 0; i < this.operations.length; i++) {
            const [operation, args] = this.operations[i];
            promises.push(
                this.db[operation]({
                    ...args,
                    __batch: {
                        instance: this,
                        operation: this.operations[i]
                    }
                })
            );
        }

        return Promise.all(promises);
    }
}

export default Batch;
