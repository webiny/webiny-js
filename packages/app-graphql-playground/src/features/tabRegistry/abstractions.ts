import { createAbstraction } from "@webiny/feature/admin";
import { PlaygroundClient } from "../playgroundClient/abstractions.js";

export interface IPlaygroundTabDefinition {
    id: string;
    name: string;
    endpoint: string;
    client: PlaygroundClient.Interface;
    defaultQuery: string;
}

export interface IPlaygroundTabRegistry {
    getTabs(): IPlaygroundTabDefinition[];
}

export const PlaygroundTabRegistry =
    createAbstraction<IPlaygroundTabRegistry>("PlaygroundTabRegistry");

export namespace PlaygroundTabRegistry {
    export type Interface = IPlaygroundTabRegistry;
    export type TabDefinition = IPlaygroundTabDefinition;
}
