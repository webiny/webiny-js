import Query from "./query";

class Update extends Query {
    generate() {
        const values = [],
            options = this.options;
        for (const [key, value] of Object.entries(options.data)) {
            values.push(key + " = " + this.escape(value));
        }

        let operation = `UPDATE ${options.table} SET ${values.join(", ")}`;
        operation += this.getWhere(options);
        operation += this.getOrder(options);
        operation += this.getLimit(options);
        operation += this.getOffset(options);

        return operation;
    }
}

export default Update;
