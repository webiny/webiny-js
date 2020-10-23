import Batch from "./Batch";
import { DbDriver, CreateArgs, ReadArgs, UpdateArgs, DeleteArgs } from "./types";

class Db {
    driver: DbDriver;
    table: string;
    constructor({ driver, table }) {
        this.driver = driver;
        this.table = table;
    }

    async create(args: CreateArgs) {
        return this.driver.create({ table: this.table, ...args });
    }

    async read(args: ReadArgs) {
        return this.driver.read({ table: this.table, ...args });
    }

    async update(args: UpdateArgs) {
        return this.driver.update({ table: this.table, ...args });
    }
    async delete(args: DeleteArgs) {
        return this.driver.delete({ table: this.table, ...args });
    }

    batch() {
        return new Batch(this);
    }
}

export default Db;
