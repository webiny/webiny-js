import { ContextPlugin } from "@webiny/handler/types";
import defaults from "./defaults";
import { withFields, string, fields } from "@commodo/fields";
import { object } from "commodo-fields-object";
import getPKPrefix from "./utils/getPKPrefix";
import { PbContext } from "@webiny/api-page-builder/types";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { hasPermission, NotAuthorizedError } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";

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
                getSettingsCacheKey() {
                    return PK();
                },
                async get() {
                    // Must have base permissions before continuing.
                    await checkBasePermissions(context);

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
                    return defaultSettings;
                },
                async update(next) {
                    // Must have base permissions before continuing.
                    await checkBasePermissions(context);

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
            }
        };
    }
};

export default plugin;
