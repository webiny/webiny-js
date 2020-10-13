import models from "./models";
import graphql from "./graphql";
import i18n from "./i18n";
import { PK_LOCALE } from "./models/localeData.model";

export default () => [
    models(),
    graphql,
    i18n,
    {
        name: "context-i18n-get-locales",
        type: "context-i18n-get-locales",
        async resolve({ context }) {
            const { I18N } = context.models;
            const locales = await I18N.find({ query: { PK: PK_LOCALE, SK: { $gt: " " } } });
            return locales
                .map(locale => {
                    return (
                        locale.data && {
                            id: locale.data.id,
                            code: locale.data.code,
                            default: locale.data.default,
                            createdOn: locale.data.createdOn
                        }
                    );
                })
                .filter(Boolean);
        }
    }
];
