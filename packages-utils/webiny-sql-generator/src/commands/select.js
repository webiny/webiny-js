import Query from "./query";

class Select extends Query {
    generate() {
        const options = this.options;
        let operation = `SELECT`;
        operation += this.getColumns(options);
        operation += ` FROM ${options.table}`;
        operation += this.getWhere(options);
        operation += this.getOrder(options);
        operation += this.getLimit(options);
        operation += this.getOffset(options);

        return operation;
    }
}

export default Select;
