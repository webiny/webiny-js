import AttributeValue from "../src/attributeValue";

declare interface IAttributesContainer {
    attr(attribute: string): IAttributesContainer;

    getParentModel(): IModel;
}

declare type AttributeValidator = (value: mixed, attr: IAttribute) => Promise<void>;
declare type AttributeValueCallback = (value: mixed) => mixed;

declare interface IAttribute {
    name: string;
    attributesContainer: IAttributesContainer;
    value: AttributeValue;
    once: boolean;
    toStorage: boolean;
    toJSON: boolean;
    skipOnPopulate: boolean;
    defaultValue: mixed;
    validators: string | AttributeValidator;
    onSetCallback: AttributeValueCallback;
    onGetCallback: AttributeValueCallback;

    getName(): string;

    getParentAttributesContainer(): IAttributesContainer;

    getParentModel(): IModel;

    setValidators(validators: string | Function): IAttribute;

    getValidators(): string | AttributeValidator;

    reset(): IAttribute;

    setSkipOnPopulate(flag: boolean): IAttribute;

    getSkipOnPopulate(): boolean;

    validateType(): void;

    validate(): Promise<void>;

    hasValue(): boolean;

    isEmpty(): boolean;

    isSet(): boolean;

    canSetValue(): boolean;

    setValue(value: any): void | Promise<void>;

    getValue(): mixed;

    onSet(callback: AttributeValueCallback): IAttribute;

    onGet(callback: AttributeValueCallback): IAttribute;

    getJSONValue(): Promise<mixed>;

    setToStorage(flag: boolean): IAttribute;

    getToStorage(): boolean;

    getStorageValue(): Promise<mixed>;

    setStorageValue(value: mixed): IAttribute;

    setDefaultValue(defaultValue: mixed): IAttribute;

    getDefaultValue(): mixed;

    setOnce(flag: boolean): IAttribute;

    getOnce(): boolean;
}

declare interface IModel {
    attr(attribute: string): IAttributesContainer;

    createAttributesContainer(): IAttributesContainer;

    getAttributesContainer(): IAttributesContainer;

    getAttribute(attribute: string): ?IAttribute;

    setAttribute(name: string, attribute: IAttribute): IModel;

    getAttributes(): { [string]: IAttribute };

    clean(): void;

    isDirty(): boolean;

    isClean(): boolean;

    populate(data: Object): IModel;

    validate(): Promise<void>;

    toJSON(path: string): Promise<{}>;

    get(path: string | Array<string>, defaultValue: mixed): Promise<mixed>;

    set(path: string, value: mixed): Promise<void>;

    toStorage(): Promise<{}>;

    populateFromStorage(data: Object): IModel;
}
