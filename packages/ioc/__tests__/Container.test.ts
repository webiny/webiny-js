import { Container, useService, useContainer } from "~/index";

test("register service by default constructor", () => {
    class Service {}

    const container = new Container();

    container.provide(Service);

    const service = container.inject(Service);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(Service);
});

test("register service by instance and type", () => {
    class Service {}

    const container = new Container();

    const provided = new Service();
    container.provide(Service, provided);

    const injected = container.inject(Service);

    expect(injected).toBeDefined();
    expect(injected).toBeInstanceOf(Service);
    expect(injected).toBe(provided);
});

test("register service by instance and base type", () => {
    class BaseService {}
    class ConcreteService extends BaseService {}

    const container = new Container();

    const provided = new ConcreteService();
    container.provide(BaseService, provided);

    const injected = container.inject(BaseService);
    // should not be able to inject by inherited type
    const injectedConcrete = container.inject(ConcreteService, { optional: true });

    expect(injected).toBeDefined();
    expect(injected).toBeInstanceOf(ConcreteService);
    expect(injected).toBe(provided);
    expect(injectedConcrete).toBe(null);
});

test("register service by instance alone", () => {
    class Service {}

    const container = new Container();
    const provided = new Service();

    container.provide(provided);

    const injected = container.inject(Service);

    expect(injected).toBeDefined();
    expect(injected).toBeInstanceOf(Service);
    expect(injected).toBe(provided);
});

test("register service by base type and instance", () => {
    class AncestorService {}
    class DerivedService extends AncestorService {}

    const container = new Container();

    container.provide(AncestorService, new DerivedService());

    const service = container.inject(AncestorService);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AncestorService);
    expect(service).toBeInstanceOf(DerivedService);
});

test("register service by base type derived type", () => {
    class AncestorService {}
    class DerivedService extends AncestorService {}

    const container = new Container();

    container.provide(AncestorService, DerivedService);

    const service = container.inject(AncestorService);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AncestorService);
    expect(service).toBeInstanceOf(DerivedService);
});

test("register dependency after dependant", () => {
    class Dependency {}
    class Dependant {
        public readonly dep = useService(Dependency);
    }

    const container = new Container();

    container.provide(Dependant);
    container.provide(Dependency);

    const service = container.inject(Dependant);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(Dependant);
    expect(service.dep).toBeDefined();
    expect(service.dep).toBeInstanceOf(Dependency);
});

test("inject dependency inside service registration", () => {
    class Dependency {}

    class Wrapper {
        public readonly dependency = container.inject(Dependency);
    }

    const container = new Container();

    container.provide(Dependency);
    container.provide(Wrapper);

    const dependency = container.inject(Dependency);
    const wrapper = container.inject(Wrapper);

    expect(dependency).toBeDefined();
    expect(dependency).toBeInstanceOf(Dependency);
    expect(wrapper).toBeDefined();
    expect(wrapper).toBeInstanceOf(Wrapper);
    expect(wrapper.dependency).toBe(dependency);
});

test("service was not registered", () => {
    class Service {}
    const container = new Container();

    expect(() => container.inject(Service)).toThrow(`Service ${Service.name} was not registered`);
});

test("resolve service from parent container", () => {
    class Service {}

    const parent = new Container();
    parent.provide(Service, new Service());

    const child = parent.createChild();

    const serviceFromParent = parent.inject(Service);
    const serviceFromChild = child.inject(Service);

    expect(serviceFromChild).toBeDefined();
    expect(serviceFromChild).toBeInstanceOf(Service);
    expect(serviceFromChild).toBe(serviceFromParent);
});

test("resolve service from grand parent container", () => {
    class Service {}

    const parent = new Container();
    parent.provide(Service, new Service());

    const child = parent.createChild().createChild();

    const serviceFromParent = parent.inject(Service);
    const serviceFromChild = child.inject(Service);

    expect(serviceFromChild).toBeDefined();
    expect(serviceFromChild).toBeInstanceOf(Service);
    expect(serviceFromChild).toBe(serviceFromParent);
});

test("resolve service in scope", () => {
    class Service {}
    const root = new Container();
    const rootService = new Service();
    root.provide(Service, rootService);

    expect(useContainer()).not.toBe(root);

    root.runInScope(() => {
        const container = useContainer();
        const service = useService(Service);

        expect(container).toBe(root);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Service);
        expect(service).toBe(rootService);
    });

    // should be restored
    expect(useContainer()).not.toBe(root);
});

test("resolve service in scope async", async () => {
    class Service {}
    const root = new Container();
    const rootService = new Service();
    root.provide(Service, rootService);

    expect(useContainer()).not.toBe(root);

    await root.runInScopeAsync(async () => {
        const container = useContainer();
        const service = useService(Service);

        await Promise.resolve();

        expect(container).toBe(root);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(Service);
        expect(service).toBe(rootService);
    });

    // should be restored
    expect(useContainer()).not.toBe(root);
});

test("resolve service in nested scope", () => {
    class Service {}
    const root = new Container();
    const rootService = new Service();
    root.provide(Service, rootService);

    expect(useContainer()).not.toBe(root);

    root.runInScope(() => {
        const container = useContainer();
        const child = container.createChild();

        child.runInScope(() => {
            const container = useContainer();
            const service = useService(Service);

            expect(container).toBe(child);
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(Service);
            expect(service).toBe(rootService);
        });

        // should be restored
        expect(useContainer()).toBe(root);
    });

    // should be restored
    expect(useContainer()).not.toBe(root);
});

test("resolve service in nested scope async", async () => {
    class Service {}
    const root = new Container();
    const rootService = new Service();
    root.provide(Service, rootService);

    expect(useContainer()).not.toBe(root);

    await root.runInScopeAsync(async () => {
        const container = useContainer();
        const child = container.createChild();

        await child.runInScopeAsync(async () => {
            const container = useContainer();
            const service = useService(Service);

            await Promise.resolve();

            expect(container).toBe(child);
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(Service);
            expect(service).toBe(rootService);
        });

        // should be restored
        expect(useContainer()).toBe(root);
    });

    // should be restored
    expect(useContainer()).not.toBe(root);
});
