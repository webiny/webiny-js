import Statement from "./statement";

class Update extends Statement {
    generate() {
        const values = [],
            options = this.options;
        for (const [key, value] of Object.entries(options.data)) {
            values.push(key + " = " + this.escape(value));
        }

        let output = `UPDATE ${options.table} SET ${values.join(", ")}`;
        output += this.getWhere(options);
        output += this.getOrder(options);
        output += this.getLimit(options);
        output += this.getOffset(options);

        return output;
    }
}

export default Update;
