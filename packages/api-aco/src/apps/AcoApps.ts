import WebinyError from "@webiny/error";
import { AcoApp } from "./AcoApp";
import { AcoAppModifierPlugin } from "~/plugins";
import { AcoContext, IAcoApp, IAcoAppParams, IAcoApps, IAcoAppsOptions } from "~/types";

export class AcoApps implements IAcoApps {
    private readonly apps: Map<string, IAcoApp> = new Map();
    private readonly context: AcoContext;
    private readonly options: IAcoAppsOptions;

    public constructor(context: AcoContext, options: IAcoAppsOptions) {
        this.context = context;
        this.options = options;
    }

    public get(name: string): IAcoApp {
        const app = this.apps.get(name);
        if (app) {
            return app;
        }
        throw new WebinyError(`App "${name}" is not registered.`, "APP_NOT_REGISTERED", {
            name,
            apps: this.apps.keys()
        });
    }

    public list(): IAcoApp[] {
        return Array.from(this.apps.values());
    }

    public async register(options: IAcoAppParams): Promise<IAcoApp> {
        const exists = this.apps.has(options.name);
        if (exists) {
            throw new WebinyError(
                `An app with the name "${options.name}" is already registered.`,
                "APP_EXISTS",
                {
                    name: options.name
                }
            );
        }
        const app = AcoApp.create(this.context, options);

        const modifiers = this.context.plugins.byType<AcoAppModifierPlugin>(
            AcoAppModifierPlugin.type
        );

        for (const modifier of modifiers) {
            if (modifier.canUse(app) === false) {
                continue;
            }
            await modifier.modify({
                context: this.context,
                app
            });
        }

        this.apps.set(app.name, app);
        return app;
    }
}
