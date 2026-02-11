```ts
// Abstraction.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Constructor, Dependencies, GetInterface, MapDependencies } from "./types.js";
import { Metadata } from "./Metadata.js";

type DropLast<T> = T extends [...infer P, any] ? [...P] : never;

type Implementation<A extends Abstraction<any>, I extends Constructor> = I & {
    __abstraction: A;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Abstraction<T> {
    public readonly token: symbol;

    constructor(name: string) {
        this.token = Symbol(name);
    }

    toString(): string {
        return this.token.description || this.token.toString();
    }

    createImplementation<I extends Constructor<GetInterface<this>>>(params: {
        implementation: I;
        dependencies: Dependencies<I>;
    }): Implementation<this, I> {
        const metadata = new Metadata(params.implementation);
        metadata.setAbstraction(this);
        metadata.setDependencies(params.dependencies);

        return params.implementation as Implementation<this, I>;
    }

    createDecorator<I extends Constructor>(params: {
        decorator: I;
        dependencies: MapDependencies<DropLast<ConstructorParameters<I>>>;
    }): Implementation<this, I> {
        const metadata = new Metadata(params.decorator);
        metadata.setAbstraction(this);
        metadata.setDependencies(params.dependencies as any);
        metadata.setAttribute("IS_DECORATOR", true);

        return params.decorator as Implementation<this, I>;
    }

    createComposite<I extends Constructor<GetInterface<this>>>(params: {
        implementation: I;
        dependencies: Dependencies<I>;
    }): Implementation<this, I> {
        const metadata = new Metadata(params.implementation);
        metadata.setAbstraction(this);
        metadata.setDependencies(params.dependencies);
        metadata.setAttribute("IS_COMPOSITE", true);

        return params.implementation as Implementation<this, I>;
    }
}
```

```ts
// Container.ts
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
```

```ts
// DependencyGraph.ts
// @ts-nocheck This file is work-in-progress.
import { Graph } from "graphlib";
import type { Container } from "./Container.js";
import { Metadata } from "./Metadata.js";
import type { Implementation } from "./types.js";

export class DependencyGraph {
    private container: Container;
    private readonly graph: Graph;

    constructor(container: Container) {
        this.container = container;
        this.graph = new Graph({ directed: true });
    }

    buildGraph(rootImplementation: Implementation<any>): Graph {
        const metadata = new Metadata(rootImplementation);
        const rootAbstraction = metadata.getAbstraction();

        if (!rootAbstraction) {
            throw new Error("Root implementation is missing an abstraction.");
        }

        const rootNodeId = this.getNodeId(rootImplementation);
        this.graph.setNode(rootNodeId);

        // Start recursive dependency traversal
        this.addDependencies(rootNodeId, rootImplementation);

        return this.graph;
    }

    private addDependencies(parentNodeId: string, implementation: Implementation<any>) {
        const metadata = new Metadata(implementation);
        const dependencies = metadata.getDependencies() || [];

        dependencies.forEach(dep => {
            const [depAbstraction] = Array.isArray(dep) ? dep : [dep];
            // @ts-expect-error TODO: fix token access
            const depEntries = this.container["implementations"].get(depAbstraction.token) || [];

            depEntries.forEach(depEntry => {
                const depNodeId = this.getNodeId(depEntry.impl);
                this.graph.setNode(depNodeId);
                this.graph.setEdge(parentNodeId, depNodeId);

                // Recurse to add further dependencies
                this.addDependencies(depNodeId, depEntry.impl);
            });
        });
    }

    private getNodeId(implementation: Implementation<any>): string {
        // Simplify node ID to only the implementation name
        return implementation.name || "Unknown Implementation";
    }
}
```

```ts
// Metadata.ts
import type { Abstraction } from "./Abstraction.js";
import type { Constructor, Dependency } from "./types.js";

export const KEYS = {
    ABSTRACTION: "wby:abstraction",
    DEPENDENCIES: "wby:dependencies",
    IS_DECORATOR: "wby:isDecorator",
    IS_COMPOSITE: "wby:isComposite"
};

export class Metadata<T extends Constructor> {
    private readonly target: T;

    constructor(target: T) {
        this.target = target;
    }

    getAbstraction(): Abstraction<unknown> {
        return Reflect.getMetadata(KEYS.ABSTRACTION, this.target);
    }

    getDependencies(): Dependency[] {
        return Reflect.getMetadata(KEYS.DEPENDENCIES, this.target);
    }

    getAttribute(key: keyof typeof KEYS) {
        return Reflect.getMetadata(KEYS[key], this.target);
    }

    setAbstraction(abstraction: Abstraction<unknown>) {
        Reflect.defineMetadata(KEYS.ABSTRACTION, abstraction, this.target);
    }

    setDependencies(dependencies: Dependency[]) {
        Reflect.defineMetadata(KEYS.DEPENDENCIES, dependencies, this.target);
    }

    setAttribute(key: keyof typeof KEYS, value: unknown) {
        Reflect.defineMetadata(KEYS[key], value, this.target);
    }
}
```

```ts
// createComposite.ts
import type { Abstraction } from "./Abstraction.js";
import type { Constructor, Dependencies, Implementation, GetInterface } from "./types.js";
import { Metadata } from "./Metadata.js";

export function createComposite<
    A extends Abstraction<any>,
    I extends Constructor<GetInterface<A>>
>(params: { abstraction: A; implementation: I; dependencies: Dependencies<I> }) {
    const metadata = new Metadata(params.implementation);
    metadata.setAbstraction(params.abstraction);
    metadata.setDependencies(params.dependencies);
    metadata.setAttribute("IS_COMPOSITE", true);

    return params.implementation as Implementation<I>;
}
```

```ts
// createDecorator.ts
import type { Abstraction } from "./Abstraction.js";
import type { Constructor, Dependency, GetInterface, MapDependencies } from "./types.js";
import { Metadata } from "./Metadata.js";

type DropLast<T> = T extends [...infer P, any] ? [...P] : never;

type GetLast<T> = T extends [...any, infer Last] ? Last : never;

type Implementation<A extends Abstraction<any>, I extends Constructor> =
    GetInterface<A> extends GetLast<ConstructorParameters<I>> ? I : "Wrong decoratee type!";

export function createDecorator<A extends Abstraction<any>, I extends Constructor>(params: {
    abstraction: A;
    decorator: Implementation<A, I>;
    dependencies: MapDependencies<DropLast<ConstructorParameters<I>>>;
}): Implementation<A, I> {
    const metadata = new Metadata(params.decorator as Constructor);
    metadata.setAbstraction(params.abstraction);
    metadata.setDependencies(params.dependencies as unknown as Dependency[]);
    metadata.setAttribute("IS_DECORATOR", true);

    return params.decorator;
}
```

```ts
// createImplementation.ts
import type { Abstraction } from "./Abstraction.js";
import type { Constructor, Dependencies, Implementation, GetInterface } from "./types.js";
import { Metadata } from "./Metadata.js";

export function createImplementation<
    A extends Abstraction<any>,
    I extends Constructor<GetInterface<A>>
>(params: { abstraction: A; implementation: I; dependencies: Dependencies<I> }) {
    const metadata = new Metadata(params.implementation);
    metadata.setAbstraction(params.abstraction);
    metadata.setDependencies(params.dependencies);

    return params.implementation as Implementation<I>;
}
```

```ts
// index.ts
export { Container } from "./Container.js";
export { Abstraction } from "./Abstraction.js";
export { createImplementation } from "./createImplementation.js";
export { createDecorator } from "./createDecorator.js";
export { createComposite } from "./createComposite.js";
export { Metadata } from "./Metadata.js";
export * from "./isDecorator.js";
export * from "./isComposite.js";
export * from "./types.js";
```

```ts
// isComposite.ts
import { Metadata } from "./Metadata.js";
import type { Constructor } from "~/types.js";

export const isComposite = (implementation: Constructor) => {
    const metadata = new Metadata(implementation);
    return Boolean(metadata.getAttribute("IS_COMPOSITE"));
};
```

```ts
// isDecorator.ts
import { Metadata } from "./Metadata.js";
import type { Constructor } from "~/types.js";

export const isDecorator = (implementation: Constructor) => {
    const metadata = new Metadata(implementation);
    return Boolean(metadata.getAttribute("IS_DECORATOR"));
};
```

```ts
// types.ts
import "reflect-metadata";
import type { Abstraction } from "./Abstraction.js";

export type Constructor<T = any> = new (...args: any[]) => T;

export type GetInterface<T> = T extends Abstraction<infer U> ? U : never;

export interface DependencyOptions {
    multiple?: boolean;
    optional?: boolean;
}

export type Dependency = Abstraction<any> | [Abstraction<any>, DependencyOptions];

export interface Registration<T = any> {
    implementation: Constructor<T>;
    dependencies: Dependency[];
    scope: LifetimeScope;
}

export interface DecoratorRegistration<T = any> {
    decoratorClass: Constructor<T>;
    dependencies: Dependency[];
}

export interface InstanceRegistration<T = any> {
    instance: T;
}

export enum LifetimeScope {
    Transient,
    Singleton
}

export type IsOptionalValue<T> = undefined extends T ? T : never;
export type IsArray<T extends Array<any>> = Array<any> extends T ? T : never;
export type GetAbstractionFromArray<T> = T extends Array<infer A> ? Abstraction<A> : never;
export type MultipleTrue = { multiple: true };
export type OptionalTrue = { optional: true };
export type MultipleFalse = { multiple: false };
export type OptionalFalse = { optional: false };

declare const implementation: unique symbol;

export type Implementation<T extends Constructor> = T & {
    [implementation]: "Implementation";
};

export type MapDependencies<T extends [...any]> = {
    [K in keyof T]-?: T[K] extends IsArray<T[K]>
        ? // Requires an array of implementations.
          [
              GetAbstractionFromArray<T[K]>,
              T[K] extends IsOptionalValue<T[K]>
                  ? MultipleTrue & OptionalTrue
                  : MultipleTrue & Partial<OptionalFalse>
          ]
        : // Requires a single implementation.
          T[K] extends IsOptionalValue<T[K]>
          ? // Support shorthand and long form.
            [Abstraction<T[K]>, OptionalTrue & Partial<MultipleFalse>]
          : // Support shorthand and long form.
            | [Abstraction<T[K]>, MultipleFalse & Partial<OptionalFalse>]
                | [Abstraction<T[K]>]
                | Abstraction<T[K]>;
};

export type Dependencies<T> = T extends Constructor
    ? MapDependencies<ConstructorParameters<T>>
    : never;
```
