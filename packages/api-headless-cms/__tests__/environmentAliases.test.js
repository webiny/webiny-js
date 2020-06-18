import mdbid from "mdbid";
import useGqlHandler from "./utils/useGqlHandler";
import { Database } from "@commodo/fields-storage-nedb";
import slugify from "slugify";

const toSlug = text =>
    slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });

const fields = `
    id
    name
    slug
`;

const READ_ENVIRONMENT_ALIAS = /* GraphQL */ `
    query getEnvironmentAlias($id: ID!) {
        cms {
            environmentAlias: getEnvironmentAlias(id: $id){
                data {
                    ${fields}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const CREATE_ENVIRONMENT_ALIAS = /* GraphQL */ `
    mutation createEnvironmentAlias($data: CmsEnvironmentAliasInput!){
        cms {
            environmentAlias: createEnvironmentAlias(data: $data) {
                data {
                    ${fields}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

describe("Environment Alias test", () => {
    const database = new Database();
    const { invoke } = useGqlHandler({ database });
    const initialEnvironment = { id: mdbid() };

    beforeAll(async () => {
        await database.collection("CmsEnvironment").insert({
            id: initialEnvironment.id,
            name: "Initial Environment",
            description: "This is the initial environment.",
            createdFrom: null
        });
    });

    let id;
    let slugged;
    it("should create a new environment alias", async () => {
        let sampleData = {
            name: "New Production",
            slug: "NewProduction"
        };
        let [body] = await invoke({
            body: {
                query: CREATE_ENVIRONMENT_ALIAS,
                variables: {
                    data: sampleData
                }
            }
        });
        slugged = toSlug(sampleData.slug);
        id = body.data.cms.environmentAlias.data.id;
        expect(body.data.cms.environmentAlias.data.slug).toBe(slugged);
    });

    it("should get an environment alias", async () => {
        let [body] = await invoke({
            body: {
                query: READ_ENVIRONMENT_ALIAS,
                variables: {
                    id
                }
            }
        });
        expect(body.data.cms.environmentAlias.data.slug).toBe(slugged);
    });
});
