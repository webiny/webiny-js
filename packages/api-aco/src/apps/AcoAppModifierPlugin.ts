import { Plugin } from "@webiny/plugins";
import { AcoContext, IAcoApp } from "~/types";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { Context } from "@webiny/handler/types";

export interface AcoAppModifierPluginModifyParams<T extends Context = AcoContext> {
    app: IAcoApp;
    context: T;
}

export interface AcoAppModifierPluginParamsCallable<T extends Context = AcoContext> {
    (params: AppModifier<T>): Promise<void>;
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
    addField: (field: CmsModelField) => void;
    removeField: (id: string) => void;
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
        addField: (field: CmsModelField) => {
            app.fields.push(field);
        },
        removeField: (id: string) => {
            const index = app.fields.findIndex(f => f.id === id);
            if (index === -1) {
                return;
            }
            app.fields.splice(index, 1);
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
