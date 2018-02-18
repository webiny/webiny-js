import Statement from "./statement";

class Delete extends Statement {
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
