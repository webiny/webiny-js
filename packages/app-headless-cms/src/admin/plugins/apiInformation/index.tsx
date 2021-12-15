import { GraphQLPlaygroundTabPlugin } from "@webiny/app-graphql-playground/types";

const manageQuery = `
#  Webiny Headless CMS Manage API
#
#  This API controls all the operations within the Headless CMS module.
#  Use it to manage content, create and modify content models and more.
#  Explore the schema for details.
#
#  Note: to use the API outside of the playground, you will need to provide an API key via the Authorization header.
#
#  Example query - list content model groups:
{
  listContentModelGroups {
    data {
      name
      icon
      slug
    }
  }
}
`.trim();
const readQuery = `
#  Webiny Headless CMS Read API
#
#  This is the API to use in your 3rd party apps to read your content.
#  It returns only content that has been published.
#
#  Note: to use the API outside of the playground, you will need to provide an API key via the Authorization header.
#
#  Example query - list content models:
{
  listContentModels {
    data {
      name
      modelId
    }
  }
}
`.trim();
const previewQuery = `
#  Webiny Headless CMS Preview API
#
#  This is the API to use in your 3rd party apps to preview content.
#  It returns the latest content revision, regardless of whether it was published or not.
#
#  Note: to use the API outside of the playground, you will need to provide an API key via the Authorization header.
#
#  Example query - list content models:
{
  listContentModels {
    data {
      name
    }
  }
}
`.trim();
import { config as appConfig } from "@webiny/app/config";

const plugins: GraphQLPlaygroundTabPlugin[] = [
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-manage",
        tab({ locale, identity }) {
            const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
            if (!identity.getPermission("cms.endpoint.manage")) {
                return null;
            }

            return {
                name: "Headless CMS - Manage API",
                endpoint: apiUrl + "/cms/manage/" + locale,
                headers: {},
                query: manageQuery
            };
        }
    },
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-read",
        tab({ locale, identity }) {
            const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
            if (!identity.getPermission("cms.endpoint.read")) {
                return null;
            }

            return {
                name: "Headless CMS - Read API",
                endpoint: apiUrl + "/cms/read/" + locale,
                headers: {},
                query: readQuery
            };
        }
    },
    {
        type: "graphql-playground-tab",
        name: "graphql-playground-tab-preview",
        tab({ locale, identity }) {
            const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
            if (!identity.getPermission("cms.endpoint.preview")) {
                return null;
            }

            return {
                name: "Headless CMS - Preview API",
                endpoint: apiUrl + "/cms/preview/" + locale,
                headers: {},
                query: previewQuery
            };
        }
    }
];

export default plugins;
