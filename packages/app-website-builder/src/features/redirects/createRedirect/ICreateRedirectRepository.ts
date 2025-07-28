import { Redirect } from "~/domain/Redirect/index.js";

export interface ICreateRedirectRepository {
    execute: (page: Redirect) => Promise<Redirect>;
}
