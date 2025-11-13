import { Abstraction } from "@webiny/di";

export function createAbstraction<T>(name: string): Abstraction<T> {
    return new Abstraction<T>(name);
}
