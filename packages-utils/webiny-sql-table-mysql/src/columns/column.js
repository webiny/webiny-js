// @flow
import { Column as BaseColumn } from "webiny-sql-table";
import ColumnsContainer from "../columnsContainer";

class Column extends BaseColumn {
    default: ?string | number;
    notNull: boolean;
    unsigned: ?boolean;
    autoIncrement: ?boolean;

    constructor(
        name: string,
        columnsContainer: ColumnsContainer,
        columnArguments: ?Array<string | number> = []
    ) {
        super(name, columnsContainer, columnArguments);

        /**
         * Column's default value.
         * @var null
         */
        this.default = undefined;

        /**
         * Defines if column accept NULL values.
         * @var null
         */
        this.notNull = false;

        /**
         * Only for numeric columns - defines if column can receive negative values or not.
         * @type {null}
         */
        this.unsigned = null;

        /**
         * Only for numeric columns - defines if column must be auto-incremented or not.
         * @type {null}
         */
        this.autoIncrement = null;
    }

    /**
     * Returns SQL definition if column.
     * @returns {string}
     */
    getSQLValue() {
        let sql = `\`${this.getName()}\` ${this.getType()}`;

        if (this.hasArguments()) {
            sql += `(${this.getArguments()
                .map(item => {
                    return typeof item === "string" ? `'${item}'` : item;
                })
                .join(", ")})`;
        }

        if (this.getUnsigned() === true) {
            sql += " unsigned";
        }

        if (this.getNotNull() === true) {
            sql += " NOT NULL";
        }

        if (this.hasDefault()) {
            const value = this.getDefault();
            if (value) {
                sql += ` DEFAULT '${value}'`;
            } else if (value === null) {
                sql += ` DEFAULT NULL`;
            }
        }

        if (this.getAutoIncrement()) {
            sql += ` AUTO_INCREMENT`;
        }

        return sql;
    }

    /**
     * Sets default column value.
     */
    setDefault(defaultValue: string | number | null): this {
        this.default = defaultValue;
        return this;
    }

    /**
     * Returns default column value.
     */
    getDefault(): ?string | number {
        return this.default;
    }

    hasDefault(): boolean {
        return typeof this.default !== "undefined";
    }

    setNotNull(notNull: boolean = true): this {
        this.notNull = notNull;
        return this;
    }

    getNotNull(): boolean {
        return this.notNull;
    }

    setArguments(receivedArguments: Array<string | number> = []): this {
        this.arguments = receivedArguments;
        return this;
    }

    getArguments(): Array<string | number> {
        return this.arguments;
    }

    hasArguments(): boolean {
        return Array.isArray(this.arguments) && this.arguments.length > 0;
    }

    setUnsigned(unsigned: boolean = true): this {
        this.unsigned = unsigned;
        return this;
    }

    getUnsigned(): ?boolean {
        return this.unsigned;
    }

    setAutoIncrement(autoIncrement: boolean = true): this {
        this.autoIncrement = autoIncrement;
        return this;
    }

    getAutoIncrement(): ?boolean {
        return this.autoIncrement;
    }

    getObjectValue(): {} {
        return {
            name: this.getName(),
            type: this.getType(),
            arguments: this.getArguments(),
            default: this.getDefault(),
            unsigned: this.getUnsigned(),
            autoIncrement: this.getAutoIncrement(),
            notNull: this.getNotNull()
        };
    }
}

export default Column;
