import Statement from "./statement";

class Select extends Statement {
    generate() {
        const options = this.options;
        let output = `SELECT`;
        output += this.getColumns(options);
        output += ` FROM ${options.table}`;
        output += this.getWhere(options);
        output += this.getOrder(options);
        output += this.getLimit(options);
        output += this.getOffset(options);

        return output;
    }
}

export default Select;
