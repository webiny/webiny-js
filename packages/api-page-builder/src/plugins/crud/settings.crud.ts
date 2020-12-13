import { ContextPlugin } from "@webiny/handler/types";
import defaults from "./utils/defaults";
import { withFields, string, fields, boolean } from "@commodo/fields";
import { object } from "commodo-fields-object";
import getPKPrefix from "./utils/getPKPrefix";
import { PbContext, Settings } from "@webiny/api-page-builder/types";
import { NotAuthorizedError } from "@webiny/api-security";
import DataLoader from "dataloader";

const SettingsModel = withFields({
    installed: boolean({ value: false }),
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

const checkBasePermissions = async (context: PbContext) => {
    await context.i18nContent.checkI18NContentPermission();
    const pbPagePermission = await context.security.getPermission("pb.settings");
    if (!pbPagePermission) {
        throw new NotAuthorizedError();
    }
};

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    async apply(context) {
        const { db } = context;
        const PK = () => `${getPKPrefix(context)}SETTINGS`;
        const SK = () => "default";

        const settingsDataLoader = new DataLoader<string, Settings>(async types => {
            const [[data]] = await db.read<Settings>({
                ...defaults.db,
                query: { PK: PK(), SK: { $gt: " " } },
                limit: 1
            });

            if (data) {
                return types.map(() => data);
            }

            const defaultSettings = await new SettingsModel().populate({}).toJSON();
            await db.create({
                ...defaults.db,
                data: { ...defaultSettings, PK: PK(), SK: SK(), TYPE }
            });

            return types.map(() => defaultSettings);
        });

        context.pageBuilder = {
            ...context.pageBuilder,
            settings: {
                __cachedSettings: null,
                getSettingsCacheKey() {
                    return PK();
                },
                async get({ auth } = { auth: true }) {
                    auth !== false && (await checkBasePermissions(context));
                    return settingsDataLoader.load("default");
                },
                async update(next, { auth } = { auth: true }) {
                    auth !== false && (await checkBasePermissions(context));

                    const current = await this.get({ auth });
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
            }
        };
    }
};

export default plugin;
