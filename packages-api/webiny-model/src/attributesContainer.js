// @flow

/**
 * Base AttributesContainer class, can be extended to implement new types of model attributes.
 */
class AttributesContainer implements IAttributesContainer {
    parentModel: IModel;
    name: string;

    constructor(model: IModel) {
        /**
         * Parent parentModel - instance of Model class.
         */
        this.parentModel = model;

        /**
         * Name of current attribute
         */
        this.name = "";
    }

    attr(attribute: string): AttributesContainer {
        this.name = attribute;
        return this;
    }

    getParentModel(): IModel {
        return this.parentModel;
    }
}

export default AttributesContainer;
