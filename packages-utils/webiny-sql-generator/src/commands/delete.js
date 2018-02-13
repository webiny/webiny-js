import Query from "./query";

class Delete extends Query {
    generate() {
        const options = this.options;
        let operation = `DELETE FROM ${options.table}`;
        operation += this.getWhere(options);
        operation += this.getOrder(options);
        operation += this.getLimit(options);
        operation += this.getOffset(options);

        return operation;
    }
}

export default Delete;
