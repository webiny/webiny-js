// @flow
import Statement from "./statement";
import SqlString from "sqlstring";

class Select extends Statement {
    generate() {
        const options = this.options;
        if (options.sql) {
            const { query, values } = options.sql;
            if (typeof query === "string") {
                return SqlString.format(query, values);
            }
        }

        let output = `SELECT`;
        if (options.calculateFoundRows) {
            output += ` SQL_CALC_FOUND_ROWS`;
        }

        output += this.getColumns(options);
        output += ` FROM \`${options.table}\``;
        output += this.getWhere(options);
        output += this.getGroup(options);
        output += this.getOrder(options);
        output += this.getLimit(options);
        output += this.getOffset(options);

        return output;
    }
}

export default Select;
