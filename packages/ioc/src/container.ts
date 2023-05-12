import {
    Container as BaseContainer,
    interfaces,
    decorate,
    injectable,
    inject as baseInject,
    multiInject as baseMultiInject,
    optional,
    named
} from "inversify";

export type Constructor<T> = new (...args: any[]) => T;

export interface Decorator<T> {
    readonly decoratee: T;
    setDecoratee(decoratee: T): void;
}

export class Container extends BaseContainer {
    registerDecorator(symbol: any, Decorator: interfaces.Newable<Decorator<any>>) {
        this.onActivation(symbol, (context, baseDependency) => {
            const resolved = context.container.resolve(Decorator);
            resolved.setDecoratee(baseDependency);
            return resolved;
        });
    }
}

export const createContainer = () => {
    return new Container({
        autoBindInjectable: true,
        defaultScope: "Transient",
        skipBaseClassChecks: true
    });
};

export const container = createContainer();

interface Injectable {
    identifier: interfaces.ServiceIdentifier;
    options: InjectOptions;
}

export const makeInjectable = (dependency: any, injectables: Injectable[] = []) => {
    decorate(injectable(), dependency);

    for (let i = 0; i < injectables.length; i++) {
        const { identifier, options } = injectables[i];
        const injectFn = options.multi ? baseMultiInject : baseInject;
        if (options.optional) {
            decorate(optional(), dependency, i);
        }
        decorate(injectFn(identifier), dependency, i);
        if (options.named !== undefined) {
            decorate(named(options.named), dependency, i);
        }
    }
};

export interface InjectOptions {
    multi?: boolean;
    optional?: boolean;
    named?: string | symbol | number;
}

export const inject = (
    identifier: interfaces.ServiceIdentifier,
    options: InjectOptions = {}
): Injectable => {
    return {
        identifier,
        options: {
            multi: options.multi ?? false,
            named: options.named,
            optional: options.optional ?? false
        }
    };
};
