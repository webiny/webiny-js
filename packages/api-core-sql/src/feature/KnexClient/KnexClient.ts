import type { Knex } from "knex";
import type { KnexClient as Abstraction } from "./abstractions.js";

export interface IKnexClientParams {
    knex: Knex;
}

export class KnexClient implements Abstraction.Interface {
    private readonly knex: Knex;

    public constructor(params: IKnexClientParams) {
        this.knex = params.knex;
    }

    public getKnex(): Knex {
        return this.knex;
    }
}
