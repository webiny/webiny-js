import authenticateJwt from "./authentication/authenticateJwt";
import authenticatePat from "./authentication/authenticatePat";
import { SecurityOptions, SecurityPlugin } from "../types";
import { ContextPlugin } from "@webiny/graphql/types";
import authorizationPlugins from "./authorization";

export default (options: SecurityOptions) => [
    {
        type: "context",
        name: "context-security",
        preApply: async context => {
            // TODO [Andrei] [help pls]: i added process.env.TESTING_AUTHENTICATION, but the test blew up:
            /*
     console.log ../handler-apollo-server/dist/plugins/createHandlerApolloServer.js:41
    [@webiny/handler-apollo-server] An error occurred: {
      "requestContext": {},
      "error": {
        "name": "TypeError",
        "message": "Cannot read property 'headers' of undefined",
        "stack": "TypeError: Cannot read property 'headers' of undefined\n    at Object.securityPlugins [as authenticate] (C:\\Users\\Andrei\\Desktop\\Webiny\\webiny3\\packages\\api-security\\src\\plugins\\authentication\\authenticateJwt.ts:7:11)\n    at Object.ctxPlugins [as preApply] (C:\\Users\\Andrei\\Desktop\\Webiny\\webiny3\\packages\\api-security\\src\\plugins\\security.ts:24:23)\n    at applyContextPlugins (C:\\Users\\Andrei\\Desktop\\Webiny\\webiny3\\packages\\graphql\\src\\createSchema\\contextPlugins.ts:7:19)\n    at runNextTicks (internal/process/task_queues.js:62:5)\n    at processImmediate (internal/timers.js:429:9)\n    at process.topLevelDomainCallback (domain.js:137:15)\n    at prepareSchema (C:\\Users\\Andrei\\Desktop\\Webiny\\webiny3\\packages\\graphql\\src\\createSchema\\prepareSchema.ts:47:21)\n    at Object.createSchema [as create] (C:\\Users\\Andrei\\Desktop\\Webiny\\webiny3\\packages\\graphql\\src\\createSchema.ts:19:82)\n    at Object.create (C:\\Users\\Andrei\\Desktop\\Webiny\\webiny3\\packages\\handler-apollo-server\\src\\plugins\\apolloHandler.ts:54:31)\n    at handle (C:\\Users\\Andrei\\Desktop\\Webiny\\webiny3\\packages\\handler-apollo-server\\dist\\plugins\\createHandlerApolloServer.js:35:11)"
      }
    }
             */
            if (!context.event /*&& !process.env.TESTING_AUTHENTICATION*/) {
                console.log("Skipping authentication...");
                return;
            }

            context.security = options;
            context.token = null;
            context.user = null;
            context.getUser = () => context.user;

            const securityPlugins = context.plugins.byType<SecurityPlugin>("authentication");
            for (let i = 0; i < securityPlugins.length; i++) {
                await securityPlugins[i].authenticate(context);
            }

            if (options.public === false && !context.token) {
                throw Error("Not authenticated!");
            }
        }
    } as ContextPlugin,
    {
        type: "authentication",
        name: "authentication-jwt",
        authenticate: authenticateJwt
    } as SecurityPlugin,
    {
        type: "authentication",
        name: "authentication-pat",
        authenticate: authenticatePat(options)
    } as SecurityPlugin,
    authorizationPlugins
];
