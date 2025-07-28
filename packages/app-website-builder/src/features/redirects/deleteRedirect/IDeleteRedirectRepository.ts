import { Redirect } from "~/domain/Redirect/index.js";

export interface IDeleteRedirectRepository {
    execute: (page: Redirect) => Promise<void>;
}
