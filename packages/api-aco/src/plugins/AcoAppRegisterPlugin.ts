import { Plugin } from "@webiny/plugins";
import { IAcoAppRegisterParams } from "~/types";

export class AcoAppRegisterPlugin extends Plugin {
    public static override type = "aco.apps.create.app";
    public readonly app: IAcoAppRegisterParams;

    public constructor(app: IAcoAppRegisterParams) {
        super();
        this.app = app;
    }
}

export const registerAcoApp = (app: IAcoAppRegisterParams) => {
    return new AcoAppRegisterPlugin(app);
};
