import { Decorator } from "./container";

export abstract class AbstractDecorator<T> implements Decorator<T> {
    private __decoratee: T | undefined;

    get decoratee() {
        if (!this.__decoratee) {
            throw Error(
                `Decoratee is not set! Make sure you register this class using container.registerDecorator()`
            );
        }

        return this.__decoratee;
    }

    setDecoratee(decoratee: T): void {
        this.__decoratee = decoratee;
    }
}
