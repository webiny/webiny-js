import type { Knex } from "knex";
import type { KnexClient as Abstraction } from "./abstractions.js";

export interface IKnexClientParams {
    knex: Knex;
}

export class KnexClient implements Abstraction.Interface {
    public readonly client;

    public constructor(params: IKnexClientParams) {
        this.client = params.knex;
    }
}
