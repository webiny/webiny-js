import WebinyError from "@webiny/error";
import { AcoApp } from "./AcoApp";
import { AcoAppModifierPlugin } from "~/plugins";
import { AcoContext, IAcoApp, IAcoAppParams, IAcoApps, IAcoAppsOptions } from "~/types";
import { CmsModelPlugin } from "@webiny/api-headless-cms";
import { createSchema } from "~/record/record.gql";

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
            apps: Array.from(this.apps.keys())
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
        /**
         * We need to create the app and run the modifiers on it.
         */
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
        /**
         * Also, we need to register the app model as the plugin one, so it can be used in the CMS.
         * We do not need to validate model or show it in the API.
         */
        this.context.plugins.register(
            new CmsModelPlugin({
                ...app.model,
                singularApiName: undefined,
                pluralApiName: undefined,
                isPrivate: true,
                noValidate: true
            })
        );
        this.apps.set(app.name, app);

        const searchRecordSchema = await createSchema({
            context: this.context,
            app
        });
        this.context.plugins.register(searchRecordSchema);

        return app;
    }
}
