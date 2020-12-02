import { useGqlHandler } from "./useGqlHandler";
import {
    createEnvironmentTestPartitionKey,
    fetchInitialEnvironment,
    getInitialEnvironment,
    getInitialEnvironmentId
} from "./helpers";
import { CmsEnvironmentType } from "@webiny/api-headless-cms/types";

enum TestHelperEnum {
    MODELS_AMOUNT = 3,
    PREFIX = "alias",
    USER_ID = "1234567890",
    USER_NAME = "userName123"
}
const createEnvironmentAliasPrefix = position => {
    return `${TestHelperEnum.PREFIX}${position}`;
};
type CreateEnvironmentAliasModelCallableArgsType = {
    prefix: string;
    environment: CmsEnvironmentType;
    suffix?: string;
};
const createEnvironmentAliasModel = ({
    prefix,
    environment,
    suffix
}: CreateEnvironmentAliasModelCallableArgsType) => {
    const append = suffix || "";
    return {
        name: `${prefix}name${append}`,
        slug: `${prefix}slug${append}`,
        description: `${prefix}description${append}`,
        environment: environment.id
    };
};

describe("Environment crud test", () => {
    const {
        createEnvironmentAliasMutation,
        getEnvironmentAliasQuery,
        updateEnvironmentAliasMutation,
        deleteEnvironmentAliasMutation,
        listEnvironmentAliasesQuery,
        documentClient
    } = useGqlHandler();

    beforeAll(async () => {
        await documentClient
            .put({
                TableName: "HeadlessCms",
                Item: {
                    PK: createEnvironmentTestPartitionKey(),
                    SK: getInitialEnvironmentId(),
                    TYPE: "cms#env",
                    ...getInitialEnvironment(),
                    createdOn: new Date().toISOString()
                }
            })
            .promise();
    });

    test("environment create, read, update, delete and list all at once", async () => {
        const environment = await fetchInitialEnvironment(documentClient);

        const createdEnvironmentAliasIdList: string[] = [];
        const prefixes = Array.from(Array(TestHelperEnum.MODELS_AMOUNT).keys()).map(prefix => {
            return createEnvironmentAliasPrefix(prefix);
        });
        for (const prefix of prefixes) {
            const modelData = createEnvironmentAliasModel({ prefix, environment });
            const [createResponse] = await createEnvironmentAliasMutation({
                data: modelData
            });
            expect(createResponse).toMatchObject({
                data: {
                    cms: {
                        createEnvironmentAlias: {
                            data: {
                                id: /([a-zA-Z0-9]+)/,
                                ...modelData,
                                environment: getInitialEnvironment(),
                                createdOn: /^20/,
                                changedOn: null,
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                }
                            },
                            error: null
                        }
                    }
                }
            });
            const createdEnvironmentAliasId =
                createResponse.data.cms.createEnvironmentAlias.data.id;
            createdEnvironmentAliasIdList.push(createdEnvironmentAliasId);

            const [getResponse] = await getEnvironmentAliasQuery({
                id: createdEnvironmentAliasId
            });

            expect(getResponse).toMatchObject({
                data: {
                    cms: {
                        getEnvironmentAlias: {
                            data: {
                                id: /([a-zA-Z0-9]+)/,
                                ...modelData,
                                environment: getInitialEnvironment(),
                                createdBy: {
                                    id: TestHelperEnum.USER_ID,
                                    name: TestHelperEnum.USER_NAME
                                },
                                createdOn: /^20/,
                                changedOn: null
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });
});
