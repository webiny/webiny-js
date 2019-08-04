// @flow
import { gql } from "apollo-server-lambda";
import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";
import { resolveGetSettings, resolveSaveSettings } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";

class ColorsModel extends Model {
    constructor() {
        super();
        this.attr("background").char();
        this.attr("text").char();
    }
}

class PaletteModel extends Model {
    constructor() {
        super();
        this.attr("popup").model(ColorsModel);
        this.attr("button").model(ColorsModel);
    }
}
class ContentModel extends Model {
    constructor() {
        super();
        this.attr("href").char();
        this.attr("message").char();
        this.attr("dismiss").char();
        this.attr("link").char();
    }
}

class CookiePolicySettingsModel extends Model {
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("position")
            .char()
            .setValidators("in:bottom:top:bottom-left:bottom-right")
            .setDefaultValue("bottom");
        this.attr("palette").model(PaletteModel);
        this.attr("content").model(ContentModel);
    }
}

export default [
    {
        name: "graphql-schema-settings-cookie-policy",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type CookiePolicySettings {
                    enabled: Boolean
                    policyLink: String
                    position: String
                    palette: CookiePolicySettingsPalette
                    content: CookiePolicySettingsContent
                }

                type CookiePolicyError {
                    code: String
                    message: String
                    data: JSON
                }

                type CookiePolicySettingsResponse {
                    data: CookiePolicySettings
                    error: CookiePolicyError
                }

                type CookiePolicySettingsContent {
                    href: String
                    message: String
                    dismiss: String
                    link: String
                }

                type CookiePolicySettingsPaletteColors {
                    background: String
                    text: String
                }

                type CookiePolicySettingsPalette {
                    popup: CookiePolicySettingsPaletteColors
                    button: CookiePolicySettingsPaletteColors
                }

                input CookiePolicySettingsInput {
                    enabled: Boolean
                    position: String
                    palette: CookiePolicySettingsPaletteInput
                    content: CookiePolicySettingsContentInput
                }

                input CookiePolicySettingsPaletteColorsInput {
                    background: String
                    text: String
                }

                input CookiePolicySettingsPaletteInput {
                    popup: CookiePolicySettingsPaletteColorsInput
                    button: CookiePolicySettingsPaletteColorsInput
                }

                input CookiePolicySettingsContentInput {
                    href: String
                    message: String
                    dismiss: String
                    link: String
                }

                extend type SettingsQuery {
                    cookiePolicy: CookiePolicySettingsResponse
                }

                extend type SettingsMutation {
                    cookiePolicy(data: CookiePolicySettingsInput): CookiePolicySettingsResponse
                }
            `,
            resolvers: {
                SettingsQuery: {
                    cookiePolicy: (_: any, args: Object, ctx: Object, info: Object) => {
                        const entity = ctx.getEntity("CookiePolicySettings");
                        return resolveGetSettings(entity)(_, args, ctx, info);
                    }
                },
                SettingsMutation: {
                    cookiePolicy: (_: any, args: Object, ctx: Object, info: Object) => {
                        const entity = ctx.getEntity("CookiePolicySettings");
                        return resolveSaveSettings(entity)(_, args, ctx, info);
                    }
                }
            }
        },
        security: {
            shield: {
                SettingsMutation: {
                    cookiePolicy: hasScope("cms:settings")
                }
            }
        }
    },
    {
        type: "entity",
        name: "entity-cookie-policy-settings",
        entity: (...args: Array<any>) => {
            return class CookiePolicySettings extends settingsFactory(...args) {
                static key = "cookie-policy";
                static classId = "CookiePolicySettings";
                static collectionName = "Settings";

                data: Object;
                load: Function;

                constructor() {
                    super();
                    this.attr("data").model(CookiePolicySettingsModel);
                }
            };
        }
    }
];
