import { Plugin } from "@webiny/plugins";
import { IAcoAppRegisterParams } from "~/apps/types";

export class CreateAcoAppPlugin extends Plugin {
    public static override type: string = "aco.apps.create.app";
    public readonly app: IAcoAppRegisterParams;

    public constructor(app: IAcoAppRegisterParams) {
        super();
        this.app = app;
    }
}

export const createAcoApp = (app: IAcoAppRegisterParams) => {
    return new CreateAcoAppPlugin(app);
};
