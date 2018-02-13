// @flow
import _ from "lodash";
import type { QueryOptions, Table } from "./../types";
import { Insert, Select, Update, Delete, Count, CreateTable } from "./commands";

class SqlGenerator {
    build(options: QueryOptions & { operation: string }): string {
        // The following line is a hack to make Flow happy when accessing methods dynamically.
        const $this: Object = (this: Object);
        if (_.isFunction($this[options.operation])) {
            return $this[options.operation](options);
        }

        throw Error(`Unknown or missing operation (${options.operation}).`);
    }

    update(options: QueryOptions & { data: Object }): string {
        const command = new Update(options);
        return command.generate();
    }

    insert(options: QueryOptions & { data: Object, onDuplicateKeyUpdate?: boolean }): string {
        const command = new Insert(options);
        return command.generate();
    }

    select(options: QueryOptions): string {
        const command = new Select(options);
        return command.generate();
    }

    delete(options: QueryOptions): string {
        const command = new Delete(options);
        return command.generate();
    }

    count(options: QueryOptions): string {
        const command = new Count(options);
        return command.generate();
    }

    createTable(options: Table) {
        const command = new CreateTable(options);
        return command.generate();
    }
}

export default SqlGenerator;
