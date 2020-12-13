import { InMemoryCache } from "@webiny/graphql-client";
import getI18NInformation from "./mocks/getI18NInformation.mock";

test("must properly cache results from queries that included args", async () => {
    const cache = new InMemoryCache();
    const { result, query } = getI18NInformation;
    await cache.writeQuery({ query, result });

    expect(cache.export()).toEqual({
        entities: {},
        queries: {
            "822877595": {
                "5864093": {
                    i18n: {
                        __typename: "I18NQuery",
                        getI18NInformation: {
                            __typename: "I18NInformationResponse",
                            currentLocales: [
                                {
                                    __typename: "I18NInformationCurrentLocale",
                                    context: "default",
                                    locale: "en-US"
                                },
                                {
                                    __typename: "I18NInformationCurrentLocale",
                                    context: "content",
                                    locale: "en-US"
                                }
                            ],
                            locales: [
                                {
                                    __typename: "I18NInformationLocale",
                                    code: "en-US",
                                    default: true
                                }
                            ]
                        }
                    }
                }
            }
        }
    });

    expect(await cache.readQuery({ query })).toEqual({
        i18n: {
            __typename: "I18NQuery",
            getI18NInformation: {
                __typename: "I18NInformationResponse",
                currentLocales: [
                    {
                        __typename: "I18NInformationCurrentLocale",
                        context: "default",
                        locale: "en-US"
                    },
                    {
                        __typename: "I18NInformationCurrentLocale",
                        context: "content",
                        locale: "en-US"
                    }
                ],
                locales: [
                    {
                        __typename: "I18NInformationLocale",
                        code: "en-US",
                        default: true
                    }
                ]
            }
        }
    });
});
