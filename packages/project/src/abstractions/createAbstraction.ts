import { Abstraction } from "@webiny/di";

export function createAbstraction<T>(name: string) {
    return new Abstraction<T>(name);
}
