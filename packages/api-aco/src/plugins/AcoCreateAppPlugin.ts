import { Plugin } from "@webiny/plugins";
import { IAcoAppRegisterParams } from "~/types";

export class AcoCreateAppPlugin extends Plugin {
    public static override type = "aco.apps.create.app";
    public readonly app: IAcoAppRegisterParams;

    public constructor(app: IAcoAppRegisterParams) {
        super();
        this.app = app;
    }
}

export const createAcoApp = (app: IAcoAppRegisterParams) => {
    return new AcoCreateAppPlugin(app);
};
