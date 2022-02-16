import { AbstractConstructor, Constructor } from "./types";

const serviceSymbol = Symbol("service");

let currentContainer: Container | undefined;

export class Container {
    public static root: Container = new Container();

    public static get current() {
        return currentContainer || Container.root;
    }

    public readonly serviceInstances = new Map<symbol, unknown>();
    public readonly serviceFactories = new Map<symbol, () => unknown>();

    public readonly parent: Container | undefined;

    constructor(parent?: Container) {
        this.parent = parent;
    }

    public inject<T>(service: AbstractConstructor<T>): T;
    public inject<T>(service: AbstractConstructor<T>, opts: { optional: boolean }): T | null;
    public inject<T>(service: AbstractConstructor<T>, opts?: { optional: boolean }): T | null {
        const current = currentContainer;
        try {
            const symbol = getServiceSymbol(service);
            let instance = this.injectCore<T>(symbol);
            if (instance) {
                return instance;
            }

            let parent = this.parent;
            while (parent) {
                instance = parent.injectCore<T>(symbol);

                if (instance) {
                    return instance;
                }

                parent = parent.parent;
            }

            if (opts?.optional) {
                return null;
            }

            throw new Error(`Service ${service.name} was not registered`);
        } finally {
            currentContainer = current;
        }
    }

    private injectCore<T>(symbol: symbol): T | undefined {
        currentContainer = this;

        let instance = this.serviceInstances.get(symbol) as T | undefined;
        if (instance) {
            return instance;
        }

        const factory = this.serviceFactories.get(symbol);
        if (factory) {
            instance = factory() as T;
            this.serviceInstances.set(symbol, instance);
            return instance;
        }

        return undefined;
    }

    public provide<T>(service: T): void;
    public provide<T extends object>(type: Constructor<T>): void;
    public provide<T extends object>(type: AbstractConstructor<T>, service: T): void;
    public provide<T extends object>(type: AbstractConstructor<T>, service: Constructor<T>): void;
    public provide(typeOrService: AbstractConstructor<object> | object, service?: object): void {
        if (typeof typeOrService !== "function") {
            // registered as an instance
            const proto = Object.getPrototypeOf(typeOrService);
            const symbol = getServiceSymbol(proto.constructor);
            this.serviceInstances.set(symbol, typeOrService);

            return;
        }

        const symbol = getServiceSymbol(typeOrService);

        if (!service) {
            // register without base type
            service = typeOrService;
        }

        if (typeof service === "function") {
            this.serviceFactories.set(symbol, () => new (service as Constructor)());
            return;
        }

        this.serviceInstances.set(symbol, service);
    }

    public provideFactory<T>(type: AbstractConstructor<T>, factory: () => T) {
        const symbol = getServiceSymbol(type);
        this.serviceFactories.set(symbol, factory);
    }

    public createChild() {
        return new Container(this);
    }

    public runInScope<T>(fcn: () => T) {
        const current = currentContainer;
        try {
            currentContainer = this;
            return fcn();
        } finally {
            const previous = currentContainer;
            currentContainer = current;

            if (previous !== this) {
                throw new Error("Container scopes are messed up!");
            }
        }
    }

    public async runInScopeAsync<T>(fcn: () => Promise<T>) {
        const current = currentContainer;
        try {
            currentContainer = this;
            return await fcn();
        } finally {
            const previous = currentContainer;
            currentContainer = current;

            if (previous !== this) {
                throw new Error("Container scopes are messed up!");
            }
        }
    }
}

function getServiceSymbol(service: AbstractConstructor) {
    if (!service.hasOwnProperty(serviceSymbol)) {
        return ((service as any)[serviceSymbol] = Symbol(service.name));
    }

    return (
        (service as any)[serviceSymbol] || ((service as any)[serviceSymbol] = Symbol(service.name))
    );
}
