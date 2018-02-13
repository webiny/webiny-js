//@flow
import type { Table } from "./../../../types";

const table: Table = {
    name: "TableSome",
    columns: {
        id: {
            type: "bigint",
            length: 20,
            unsigned: true,
            allowNull: false
        },
        name: {
            type: "varchar",
            length: 20
        },
        status: {
            type: "enum",
            values: ["active", "inactive"],
            default: "inactive"
        }
    }
};

export default table;
