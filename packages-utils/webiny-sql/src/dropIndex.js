import Statement from "./statement";

class DropIndex extends Statement {
    generate() {
        return `ALTER TABLE \`${this.options.table}\` DROP INDEX \`${this.options.name}\``;
    }
}

export default DropIndex;
