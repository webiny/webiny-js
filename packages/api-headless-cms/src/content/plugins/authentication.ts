// TODO [Andrei] [Now]: write test for authentication.ts
//  C:\Users\Andrei\Desktop\Webiny\webiny3\packages\api-headless-cms\__tests__\schemaRebuilding.test.js
//  C:\Users\Andrei\Desktop\Webiny\webiny3\packages\api-headless-cms\__tests__\accessTokensAuthentication.test.js

/*
{
  listContentModels{
    data{
      id
    }
  }
}

# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiNWU3MzkzYmY1OGQ0ODMwMDA3OTVkYmM1IiwidHlwZSI6InVzZXIiLCJhY2Nlc3MiOnsic2NvcGVzIjpbXSwicm9sZXMiOltdLCJmdWxsQWNjZXNzIjp0cnVlfX0sImV4cCI6MTU5NTUyMjQ5NCwiaWF0IjoxNTkyOTMwNDk1fQ.UIDsuGF5JcKoRprMQJBi2hA7CpJ8UHsBKJ5wwXskLI8
# PAT = d218e7fe9bd71e1c73a6804b77a3f94bc288edc84187465b
# AT = 7e12cf9da7611de4cdfcfc3eed05c9fa147276baeb169883
 */
import { withStorage, withFields, string, withName, pipe } from "@webiny/commodo";

const createAccessToken = createBase => pipe(withName("CmsAccessToken"))(createBase());

const environment2accessToken = createBase =>
    pipe(
        withName("CmsEnvironment2AccessToken"),
        withFields(() => ({
            environment: string()
        }))
    )(createBase());

export default {
    name: "authentication-access-token",
    type: "authentication-disabled",
    authenticate: async context => {
        // return false;
        const createBase = () =>
            pipe(
                withFields({
                    id: context.commodo.fields.id()
                }),
                withStorage({ driver: context.commodo.driver })
            )();
        const CmsAccessToken = createAccessToken(createBase); //CmsAccessTokenFactory({ createBase, context });
        const CmsEnvironment2AccessToken = environment2accessToken(createBase);

        console.log("WRROOOOOM, AUTHENTICATING...");
        console.log(context);
        console.log(context.models);
        if (!context.event) {
            return;
        }

        if (context.event.isMetaQuery) {
            return;
        }

        if (process.env.NODE_ENV === "test") {
            // Skip authentication when running tests
            return;
        }

        console.log(1);
        const accessToken =
            context.event.headers["authorization"] || context.event.headers["Authorization"];
        // const { CmsAccessToken } = context.models;
        console.log("Authorizing...");
        console.log(accessToken);

        const token = await CmsAccessToken.findOne({
            // TODO [Andrei] Fix "Cannot read property 'CmsEnvironment' of undefined", here:36
            query: { token: accessToken }
        });
        console.log(2);
        console.log(token);

        if (!token) {
            return false;
        }

        const allowedEnvironments = await CmsEnvironment2AccessToken.find({
            query: { accessToken: token.id }
        });
        const currentEnvironment = context.cms.getEnvironment();
        if (!allowedEnvironments.find(env => env.id === currentEnvironment.id)) {
            return false;
        }

        context.token = token;

        return true;
    }
};
