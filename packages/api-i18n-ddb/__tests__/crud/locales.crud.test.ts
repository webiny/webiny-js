import useGqlHandler from "../useGqlHandler";
import originField from "../mocks/originField";

const localeData = {
    code: "hr-HR",
    default: true,
    origin: "Webiny"
};

const expectedLocaleData = {
    ...localeData,
    createdBy: {
        id: "admin@webiny.com",
        displayName: "John Doe",
        type: "admin"
    },
    createdOn: expect.stringMatching(/^20/)
};

describe("Locales crud", () => {
    const { createI18NLocale, updateI18NLocale } = useGqlHandler({
        plugins: [originField()]
    });

    test("it should write a string into a origin field", async () => {
        const [createResponse] = await createI18NLocale(
            {
                data: localeData
            },
            ["origin"]
        );

        expect(createResponse).toEqual({
            data: {
                i18n: {
                    createI18NLocale: {
                        data: {
                            ...expectedLocaleData
                        },
                        error: null
                    }
                }
            }
        });

        const [updateResponse] = await updateI18NLocale(
            {
                code: localeData.code,
                data: {
                    default: true,
                    origin: "web"
                }
            },
            ["origin"]
        );

        expect(updateResponse).toEqual({
            data: {
                i18n: {
                    updateI18NLocale: {
                        data: {
                            ...expectedLocaleData,
                            origin: "web"
                        },
                        error: null
                    }
                }
            }
        });
    });
});
