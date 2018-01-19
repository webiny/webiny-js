/**
 * Base AttributesContainer class, can be extended to implement new types of model attributes.
 */
class AttributesContainer {
    constructor(model) {
        /**
         * Parent parentModel - instance of Model class.
         */
        this.parentModel = model;

        /**
         *
         * @type {null}
         */
        this.name = null;
    }

    attr(attribute) {
        this.name = attribute;
        return this;
    }

    getParentModel() {
        return this.parentModel;
    }
}

export default AttributesContainer;