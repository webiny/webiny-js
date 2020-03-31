const path = require("path");
const fs = require("fs");

class Component {
    constructor(id, context) {
        this.id = id || this.constructor.name;

        if (this.id === "Context") {
            throw Error('You cannot use "Context" as a component name. It is reserved.');
        }

        // we need to keep the entire instance in memory to pass it to child components
        this.context = {
            instance: context
        };

        // Set state
        this.state = {};

        // make sure author defined at least a default function
        if (typeof this.default !== "function") {
            throw Error(`default function is missing for component "${this.id}"`);
        }

        const defaultFunction = (...args) => {
            return this.default.call(this, ...args);
        };

        // Add Component class properties like context and state
        Object.keys(this).forEach(prop => {
            defaultFunction[prop] = this[prop];
        });

        // Add Component class methods like the save() method
        const classMethods = Object.getOwnPropertyNames(Component.prototype);
        classMethods.forEach(classMethod => {
            defaultFunction[classMethod] = (...classMethodInputs) =>
                this[classMethod].call(this, ...classMethodInputs); // apply instance context
        });

        // Add instance methods
        // those are the methods of the class this extends Component
        // if user added his own save() method for example,
        // this would overwrite the Component class save() method
        const instanceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        instanceMethods.forEach(instanceMethod => {
            defaultFunction[instanceMethod] = (...args) => this[instanceMethod].call(this, ...args);
        });

        return defaultFunction;
    }

    // populating state is an async operation in most contexts
    // and we can't run async operations in the constructor
    // so we can't auto populate state on instance construction
    async init() {
        this.state = await this.context.instance.readState(this.id);

        // the context object in the component instance is a subset
        // of the actual context instance, to keep the component
        // api clean, and be able to turn it off for child components
        this.context.credentials = this.context.instance.credentials;
        this.context.resourceId = () => this.context.instance.resourceId();
        this.context.log = msg => this.context.instance.log(msg);
        this.context.debug = msg => this.context.instance.debug(msg);
        this.context.status = (msg, entity) => this.context.instance.status(msg, entity || this.id);

        // keeping this function for a while
        this.context.output = (key, val) => {
            if (typeof this.context.instance.output === "function") {
                return this.context.instance.output(key, val);
            }
            return;
        };
    }

    async save() {
        await this.context.instance.writeState(this.id, this.state);
    }

    async load(nameOrPath, componentAlias) {
        let externalComponentPath;
        let childComponent;

        if (this.context.instance.root) {
            externalComponentPath = path.resolve(
                this.context.instance.root,
                nameOrPath,
                "serverless.js"
            );
        } else {
            externalComponentPath = path.resolve(nameOrPath, "serverless.js");
        }

        if (fs.existsSync(externalComponentPath)) {
            delete require.cache[require.resolve(externalComponentPath)];
            childComponent = require(externalComponentPath);
        } else {
            childComponent = require(nameOrPath);
        }

        const childComponentId = `${this.id}.${componentAlias || childComponent.name}`;

        const childComponentInstance = new childComponent(childComponentId, this.context.instance);

        // populate state based on the component id
        await childComponentInstance.init();

        // disable context methods for child components
        childComponentInstance.context.log = () => {};
        childComponentInstance.context.status = () => {};
        childComponentInstance.context.output = () => {};

        return childComponentInstance;
    }
}

module.exports = { Component };
