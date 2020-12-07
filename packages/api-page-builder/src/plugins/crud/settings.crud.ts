import { ContextPlugin } from "@webiny/handler/types";
import defaults from "./utils/defaults";
import { withFields, string, fields, boolean } from "@commodo/fields";
import { object } from "commodo-fields-object";
import getPKPrefix from "./utils/getPKPrefix";
import { PbContext } from "@webiny/api-page-builder/types";
import { NotAuthorizedError } from "@webiny/api-security";

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
    apply(context) {
        const { db } = context;
        const PK = () => `${getPKPrefix(context)}SETTINGS`;
        const SK = () => "default";

        context.pageBuilder = {
            ...context.pageBuilder,
            settings: {
                __cachedSettings: null,
                getSettingsCacheKey() {
                    return PK();
                },
                async get({ auth } = { auth: true }) {
                    if (this.__cachedSettings) {
                        return this.__cachedSettings;
                    }

                    auth !== false && (await checkBasePermissions(context));

                    const [[data]] = await db.read({
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

                    this.__cachedSettings = defaultSettings;
                    return this.__cachedSettings;
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
