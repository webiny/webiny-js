import * as di from "@webiny/di";

type DropLast<T> = T extends [...infer P, any] ? [...P] : never;

export class Abstraction<T> extends di.Abstraction<T> {
    createImplementation<I extends di.Constructor<di.GetInterface<this>>>(params: {
        implementation: I;
        dependencies: di.Dependencies<I>;
    }): di.Implementation<I> {
        return di.createImplementation({
            abstraction: this,
            implementation: params.implementation,
            dependencies: params.dependencies
        });
    }

    createDecorator<I extends di.Constructor>(params: {
        decorator: I;
        dependencies: di.MapDependencies<DropLast<ConstructorParameters<I>>>;
    }) {
        const result = di.createDecorator({
            abstraction: this as any,
            decorator: params.decorator,
            dependencies: params.dependencies as any
        } as any);
        return result as di.Constructor<any>;
    }

    createComposite<I extends di.Constructor<di.GetInterface<this>>>(params: {
        implementation: I;
        dependencies: di.Dependencies<I>;
    }): di.Implementation<I> {
        return di.createComposite({
            abstraction: this,
            implementation: params.implementation,
            dependencies: params.dependencies
        });
    }
}

export function createAbstraction<T>(name: string): Abstraction<T> {
    return new Abstraction<T>(name);
}
