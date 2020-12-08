import { InMemoryCache } from "@webiny/graphql-client";
import getI18NInformation from "./mocks/getI18NInformation.mock";

test("must properly cache results from queries that included args", async () => {
    const cache = new InMemoryCache();
    const { result, query } = getI18NInformation;
    await cache.writeQuery({ query, result });

    expect(cache.export()).toEqual({
        "entities": {},
        "queries": {
            "587088053": {
                "5864093": {
                    "i18n": {
                        "getI18NInformation": {
                            "currentLocales": [
                                {
                                    "context": "default",
                                    "locale": "en-US"
                                },
                                {
                                    "context": "content",
                                    "locale": "en-US"
                                }
                            ],
                            "locales": [
                                {
                                    "code": "en-US",
                                    "default": true
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
            getI18NInformation: {
                currentLocales: [
                    {
                        context: "default",
                        locale: "en-US"
                    },
                    {
                        context: "content",
                        locale: "en-US"
                    }
                ],
                locales: [{ code: "en-US", default: true }]
            }
        }
    });
});
