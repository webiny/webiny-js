// @flow
import type Table from "./table";
import IndexesContainer from "./indexesContainer";

class Index {
    name: string;
    type: string;
    indexesContainer: IndexesContainer;
    toJSON: {};
    autoIncrement: boolean;
    allowNull: boolean;
    default: mixed;
    constructor(name: string, indexesContainer: IndexesContainer) {
        /**
         * Index name.
         */
        this.name = name;

        /**
         * Index's parent table instance.
         */
        this.indexesContainer = indexesContainer;

        /**
         * Index's default value.
         * @var null
         */
        this.default = null;

        /**
         * Defines if index is auto incremented or not (most commonly used for 'id' index).
         * @var null
         */
        this.autoIncrement = false;

        /**
         * Defines if index accept NULL values.
         * @var null
         */
        this.allowNull = true;
    }

    /**
     * Returns name of index
     */
    getName(): string {
        return this.name;
    }

    getType(): string {
        return "";
    }

    /**
     * Returns parent table indexes container
     */

    getParentIndexesContainer(): IndexesContainer {
        return this.indexesContainer;
    }

    /**
     * Returns table
     */
    getParentTable(): Table {
        return this.getParentIndexesContainer().getParentTable();
    }

    getJSONValue(): {} {
        return {
            name: this.getName(),
            type: this.getType()
        };
    }

    /**
     * Sets default index value.
     */
    setDefault(defaultValue: ?mixed): this {
        this.default = defaultValue;
        return this;
    }

    /**
     * Returns default index value.
     */
    getDefault() {
        return this.default;
    }

    setAutoIncrement(autoIncrement: boolean): this {
        this.autoIncrement = autoIncrement;
        return this;
    }

    getAutoIncrement(): boolean {
        return this.autoIncrement;
    }

    setAllowNull(allowNull: boolean): this {
        this.allowNull = allowNull;
        return this;
    }

    getAllowNull(): boolean {
        return this.allowNull;
    }
}

export default Index;
