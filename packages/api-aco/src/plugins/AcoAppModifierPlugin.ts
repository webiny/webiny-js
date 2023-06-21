import { Plugin } from "@webiny/plugins";
import {
    AcoContext,
    IAcoApp,
    IAcoAppAddFieldCallable,
    IAcoAppModifyFieldCallable,
    IAcoAppRemoveFieldCallable
} from "~/types";
import { Context } from "@webiny/handler/types";

export interface AcoAppModifierPluginModifyParams<T extends Context = AcoContext> {
    app: IAcoApp;
    context: T;
}

export interface AcoAppModifierPluginParamsCallable<T extends Context = AcoContext> {
    (params: AppModifier<T>): Promise<void> | void;
}

export interface AcoAppModifierPluginParams<T extends Context = AcoContext> {
    name: string;
    cb: AcoAppModifierPluginParamsCallable<T>;
}

export interface AppModifier<T extends Context = AcoContext> {
    /**
     * We can access the app if really required.
     * @internal
     */
    app: IAcoApp;
    /**
     * We can access the context if really required.
     * @internal
     */
    context: T;
    addField: IAcoAppAddFieldCallable;
    removeField: IAcoAppRemoveFieldCallable;
    modifyField: IAcoAppModifyFieldCallable;
}

export interface AppModifierParams<T extends Context = AcoContext> {
    app: IAcoApp;
    context: T;
}

const createModifier = <T extends Context>({
    app,
    context
}: AppModifierParams<T>): AppModifier<T> => {
    return {
        app,
        context,
        addField: field => {
            app.addField(field);
        },
        removeField: id => {
            app.removeField(id);
        },
        modifyField: (id, cb) => {
            app.modifyField(id, cb);
        }
    };
};

export class AcoAppModifierPlugin<T extends Context = Context> extends Plugin {
    public static override readonly type: string = "aco.app.modifier";

    private readonly params: AcoAppModifierPluginParams<T>;

    private constructor(params: AcoAppModifierPluginParams<T>) {
        super();
        this.params = params;
    }

    public static create<C extends Context = AcoContext>(params: AcoAppModifierPluginParams<C>) {
        return new AcoAppModifierPlugin<C>(params);
    }

    public canUse(app: IAcoApp): boolean {
        return app.name === this.params.name;
    }

    public async modify(params: AcoAppModifierPluginModifyParams<T>): Promise<void> {
        const { app, context } = params;
        return this.params.cb(
            createModifier<T>({
                app,
                context
            })
        );
    }
}

export type CreateAcoAppModifierCallable<T extends Context = AcoContext> =
    AcoAppModifierPluginParamsCallable<T>;

export const createAcoAppModifier = <T extends Context = AcoContext>(
    name: string,
    cb: CreateAcoAppModifierCallable<T>
) => {
    return AcoAppModifierPlugin.create<T>({
        name,
        cb
    });
};
