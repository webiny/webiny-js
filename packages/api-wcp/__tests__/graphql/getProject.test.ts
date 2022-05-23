import { useGqlHandler } from "../utils/useGqlHandler";

describe(`WCP Project Test`, () => {
    const gqlHandler = useGqlHandler();
    const { getProject } = gqlHandler;

    test(`should be able to retrieve current WCP project`, async () => {
        console.log("woasd");



        const response = await getProject();
        const bbb = 123;
    });
});
