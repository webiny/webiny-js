// @flow
import ColumnsContainer from "./columnsContainer";
import IndexesContainer from "./indexesContainer";
import type { CommandOptions } from "../types";
import type Table from "./table";

class Driver {
    getColumnsClass(): Class<ColumnsContainer> {
        return ColumnsContainer;
    }

    getIndexesClass(): Class<IndexesContainer> {
        return IndexesContainer;
    }

    // eslint-disable-next-line
    async create(table: Table, options: CommandOptions): Promise<string> {
        return "";
    }

    // eslint-disable-next-line
    async alter(table: Table, options: CommandOptions): Promise<string> {
        return "";
    }

    // eslint-disable-next-line
    async drop(table: Table, options: CommandOptions): Promise<string> {
        return "";
    }

    // eslint-disable-next-line
    async truncate(table: Table, options: CommandOptions): Promise<string> {
        return "";
    }

    // eslint-disable-next-line
    async sync(table: Table, options: CommandOptions): Promise<string> {
        return "";
    }

    // eslint-disable-next-line
    async execute(sql: string): Promise<mixed> {
        return null;
    }
}

export default Driver;
