import type { Abstraction } from "./Abstraction.js";
import type {
    Constructor,
    Registration,
    DecoratorRegistration,
    InstanceRegistration,
    Dependencies,
    DependencyOptions
} from "./types.js";
import { LifetimeScope } from "./types.js";
import { Metadata } from "./Metadata.js";
import { isComposite } from "./isComposite.js";
import { isDecorator } from "./isDecorator.js";

export class Container {
    private registrations = new Map<symbol, Registration[]>();
    private decorators = new Map<symbol, DecoratorRegistration[]>();
    private instances = new Map<string, any>();
    private factories = new Map<symbol, () => any>();
    private instanceRegistrations = new Map<symbol, InstanceRegistration[]>();
    private composites = new Map<symbol, Registration>();
    private parent?: Container;

    register<T>(implementation: Constructor<T>): RegistrationBuilder<T> {
        const metadata = new Metadata(implementation);
        const abstraction = metadata.getAbstraction();
        const dependencies = metadata.getDependencies();

        if (isComposite(implementation)) {
            throw new Error(
                `${implementation.name} is a composite! Use the "registerComposite" method.`
            );
        }

        if (isDecorator(implementation)) {
            throw new Error(
                `${implementation.name} is a decorator! Use the "registerDecorator" method.`
            );
        }

        if (!abstraction) {
            throw new Error(`No abstraction metadata found for ${implementation.name}`);
        }

        const registration: Registration<T> = {
            implementation,
            dependencies: dependencies || [],
            scope: LifetimeScope.Transient
        };

        const existing = this.registrations.get(abstraction.token) || [];
        this.registrations.set(abstraction.token, [...existing, registration]);

        return new RegistrationBuilder(registration);
    }

    registerInstance<T>(abstraction: Abstraction<T>, instance: T): void {
        const registration: InstanceRegistration<T> = { instance };
        const existing = this.instanceRegistrations.get(abstraction.token) || [];
        this.instanceRegistrations.set(abstraction.token, [...existing, registration]);
    }

    registerFactory<T>(abstraction: Abstraction<T>, factory: () => T): void {
        this.factories.set(abstraction.token, factory);
    }

    registerDecorator<T>(decorator: Constructor<T>): void {
        const metadata = new Metadata(decorator);
        const abstraction = metadata.getAbstraction();
        const dependencies = metadata.getDependencies();

        if (!isDecorator(decorator)) {
            throw new Error(
                `${decorator.name} is not a decorator! Use the "createDecorator" factory.`
            );
        }

        if (!abstraction) {
            throw new Error(`No abstraction metadata found for ${decorator.name}`);
        }

        const registration: DecoratorRegistration<T> = {
            decoratorClass: decorator,
            dependencies: dependencies || []
        };

        const existing = this.decorators.get(abstraction.token) || [];
        this.decorators.set(abstraction.token, [...existing, registration]);
    }

    registerComposite<T>(implementation: Constructor<T>): void {
        const metadata = new Metadata(implementation);
        const abstraction = metadata.getAbstraction();
        const dependencies = metadata.getDependencies();

        if (!isComposite(implementation)) {
            throw new Error(
                `${implementation.name} is not a composite! Use the "createComposite" factory.`
            );
        }

        if (!abstraction) {
            throw new Error(`No abstraction metadata found for ${implementation.name}`);
        }

        const registration: Registration<T> = {
            implementation,
            dependencies: dependencies || [],
            scope: LifetimeScope.Transient
        };

        this.composites.set(abstraction.token, registration);
    }

    resolve<T>(abstraction: Abstraction<T>): T {
        return this.resolveInternal(abstraction, new Map(), {});
    }

    resolveAll<T>(abstraction: Abstraction<T>): T[] {
        const registrations = this.registrations.get(abstraction.token) || [];
        const instanceRegs = this.instanceRegistrations.get(abstraction.token) || [];

        const results: T[] = [];

        // Resolve all instance registrations
        for (const instanceReg of instanceRegs) {
            results.push(instanceReg.instance);
        }

        // Resolve all class registrations
        for (const registration of registrations) {
            const instance = this.resolveRegistration(abstraction, registration, new Map());
            results.push(instance);
        }

        return results;
    }

    resolveWithDependencies<T extends Constructor>(config: {
        implementation: T;
        dependencies: Dependencies<T>;
    }): InstanceType<T> {
        const { implementation, dependencies } = config;
        const Constructor = implementation;

        const resolvedDeps = dependencies.map(dep => {
            const [abstractionDep, depOptions] = Array.isArray(dep) ? dep : [dep, {}];
            return this.resolveInternal(abstractionDep, new Map(), depOptions);
        });

        return new Constructor(...resolvedDeps);
    }

    createChildContainer(): Container {
        const child = new Container();
        child.parent = this;
        return child;
    }

    private resolveInternal<T>(
        abstraction: Abstraction<T>,
        resolutionStack: Map<symbol, boolean>,
        options: DependencyOptions
    ): T {
        if (resolutionStack.has(abstraction.token) && !options.multiple) {
            throw new Error(`Circular dependency detected for ${abstraction.toString()}`);
        }

        const result = this.tryResolveFromCurrentContainer(abstraction, resolutionStack, options);
        if (result !== undefined) {
            return result;
        }

        if (this.parent) {
            return this.parent.resolveInternal(abstraction, resolutionStack, options);
        }

        if (options.optional) {
            return undefined as any;
        }

        throw new Error(`No registration found for ${abstraction.toString()}`);
    }

    private tryResolveFromCurrentContainer<T>(
        abstraction: Abstraction<T>,
        resolutionStack: Map<symbol, boolean>,
        options: DependencyOptions
    ): T | undefined {
        const registrations = this.registrations.get(abstraction.token) || [];
        const instanceRegs = this.instanceRegistrations.get(abstraction.token) || [];

        if (options.multiple) {
            return this.resolveMultiple(
                abstraction,
                registrations,
                instanceRegs,
                resolutionStack
            ) as any;
        }

        const composite = this.composites.get(abstraction.token);
        if (composite) {
            resolutionStack.set(abstraction.token, true);

            const resolvedDeps = composite.dependencies.map(dep => {
                const [abstractionDep, depOptions] = Array.isArray(dep) ? dep : [dep, {}];
                return this.resolveInternal(abstractionDep, new Map(resolutionStack), depOptions);
            });

            const instance = new composite.implementation(...resolvedDeps);
            resolutionStack.delete(abstraction.token);
            return instance;
        }

        if (instanceRegs.length > 0) {
            const instance = instanceRegs[instanceRegs.length - 1].instance;
            return this.applyDecorators(abstraction, instance, resolutionStack);
        }

        if (registrations.length > 0) {
            const registration = registrations[registrations.length - 1];
            return this.resolveRegistration(abstraction, registration, resolutionStack);
        }

        const factory = this.factories.get(abstraction.token);
        if (factory) {
            const instance = factory();
            return this.applyDecorators(abstraction, instance, resolutionStack);
        }

        return undefined;
    }

    private resolveRegistration<T>(
        abstraction: Abstraction<T>,
        registration: Registration<T>,
        resolutionStack: Map<symbol, boolean>
    ): T {
        const instanceKey = `${abstraction.token.toString()}::${registration.implementation.name}`;
        if (registration.scope === LifetimeScope.Singleton) {
            const existing = this.instances.get(instanceKey);
            if (existing) {
                return existing;
            }
        }

        resolutionStack.set(abstraction.token, true);

        const resolvedDeps = registration.dependencies.map(dep => {
            const [abstractionDep, depOptions] = Array.isArray(dep) ? dep : [dep, {}];
            return this.resolveInternal(abstractionDep, new Map(resolutionStack), depOptions);
        });

        const instance = new registration.implementation(...resolvedDeps);
        const decoratedInstance = this.applyDecorators(abstraction, instance, resolutionStack);

        if (registration.scope === LifetimeScope.Singleton) {
            this.instances.set(instanceKey, decoratedInstance);
        }

        resolutionStack.delete(abstraction.token);
        return decoratedInstance;
    }

    private resolveMultiple<T>(
        abstraction: Abstraction<T>,
        registrations: Registration[],
        instanceRegistrations: InstanceRegistration[],
        resolutionStack: Map<symbol, boolean>
    ): T[] {
        const results: T[] = [];

        for (const instanceReg of instanceRegistrations) {
            const decorated = this.applyDecorators(
                abstraction,
                instanceReg.instance,
                resolutionStack
            );
            results.push(decorated);
        }

        for (const registration of registrations) {
            const instance = this.resolveRegistration(abstraction, registration, resolutionStack);
            results.push(instance);
        }

        return results;
    }

    private applyDecorators<T>(
        abstraction: Abstraction<T>,
        instance: T,
        resolutionStack: Map<symbol, boolean>
    ): T {
        const decorators = this.decorators.get(abstraction.token) || [];
        let result = instance;

        for (const decorator of decorators) {
            const decoratorDeps = decorator.dependencies.map(dep => {
                const [abstractionDep, depOptions] = Array.isArray(dep) ? dep : [dep, {}];
                return this.resolveInternal(abstractionDep, new Map(resolutionStack), depOptions);
            });

            result = new decorator.decoratorClass(...decoratorDeps, result);
        }

        return result;
    }
}

class RegistrationBuilder<T> {
    constructor(private registration: Registration<T>) {}

    inSingletonScope(): void {
        this.registration.scope = LifetimeScope.Singleton;
    }
}
