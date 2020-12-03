import { ContextPlugin } from "@webiny/handler/types";
import defaults from "./defaults";
import { withFields, string, fields } from "@commodo/fields";
import { object } from "commodo-fields-object";
import getPKPrefix from "./utils/getPKPrefix";
import { PbContext } from "@webiny/api-page-builder/types";

export type Settings = {
    nme: string;
    domain: string;
    favicon: Record<string, any>; // TODO: define types
    logo: Record<string, any>; // TODO: define types
    social: {
        facebook: string;
        twitter: string;
        instagram: string;
        image: Record<string, any>; // TODO: define types
    };
    pages: {
        home: string;
        notFound: string;
        error: string;
    };
};

const SettingsModel = withFields({
    name: string({ validation: "required,maxLength:500" }),
    domain: string({ validation: "url,maxLength:500" }),
    favicon: object({}),
    logo: object({}),
    social: fields({
        value: {},
        instanceOf: withFields({
            facebook: string({ validation: "url,maxLength:500" }),
            twitter: string({ validation: "url,maxLength:500" }),
            instagram: string({ validation: "url,maxLength:500" }),
            image: object({})
        })()
    }),
    pages: fields({
        value: {},
        instanceOf: withFields({
            home: string(),
            notFound: string(),
            error: string()
        })()
    })
})();

const TYPE = "pb.settings";

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    apply(context) {
        const { db } = context;
        const PK = () => `${getPKPrefix(context)}SETTINGS`;
        const SK = () => "default";

        context.settings = {
            async get() {
                const [[data]] = await db.read<Settings>({
                    ...defaults.db,
                    query: { PK: PK(), SK: { $gt: " " } },
                    limit: 1
                });

                if (data) {
                    return data;
                }

                const defaultSettings = await new SettingsModel().populate({}).toJSON();
                await db.create({
                    ...defaults.db,
                    data: { ...defaultSettings, PK: PK(), SK: SK(), TYPE }
                });
                return defaultSettings;
            },
            async update(next) {
                const current = await this.get();
                const settings = new SettingsModel().populate(current).populate(next);
                await settings.validate();

                const data = await settings.toJSON();

                await db.update({
                    ...defaults.db,
                    query: { PK: PK(), SK: SK() },
                    data
                });

                return settings.toJSON();
            }
        };
    }
};

export default plugin;
