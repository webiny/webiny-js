import type { GraphQLPlaygroundTabPlugin } from "~/types.js";
import { config as appConfig } from "@webiny/app/config.js";

const placeholder = `#  Webiny Main API
#
#  This is the core API that has access to all the features of your Webiny instance.
#
#  Note: to use the API outside of the playground, you will need to provide an API key via the Authorization header.
#
#  Example query - list all users:
{
  adminUsers {
    listUsers {
      data {
        email
        firstName
        createdOn
      }
    }
  }
}
`;

const plugin: GraphQLPlaygroundTabPlugin = {
    type: "graphql-playground-tab",
    tab() {
        const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL) as string;
        return {
            name: "Main API",
            endpoint: apiUrl + "/graphql",
            headers: {},
            query: placeholder
        };
    }
};

export default [plugin];
