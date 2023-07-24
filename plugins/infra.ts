import { Config, ApiConfig } from "@webiny/infra";

export default () => [
    new Config({
        pulumiResourceNamePrefix: ({params}) => {
            return 'wby-'
        }
    }),
    new ApiConfig({
        afterDeploy: async () => {
            console.log("after deploy WOHOOOOO! 🌴🌴🌴🌴🌴🌴🌴🌴🌴🌴");
        }
    })
];
