import { Redirect } from "~/domain/Redirect/index.js";

export interface IUpdateRedirectRepository {
    execute: (redirect: Redirect) => Promise<void>;
}
