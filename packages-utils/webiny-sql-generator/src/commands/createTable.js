import Query from "./query";

class CreateTable extends Query {
    generate() {
        const options = this.options;
        let operation = `SELECT COUNT(*) AS count FROM ${options.table}`;
        operation += this.getWhere(options);
        operation += this.getOrder(options);
        operation += this.getLimit(options);
        operation += this.getOffset(options);

        return operation;
    }
}

export default CreateTable;
