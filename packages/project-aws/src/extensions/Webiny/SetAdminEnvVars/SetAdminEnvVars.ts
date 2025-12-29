import { getStackOutput } from "@webiny/project";
import { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";

interface ISetAdminEnvVarsDi {
    projectSdkParamsService: ProjectSdkParamsService.Interface;
}

export class SetAdminEnvVars {
    di: ISetAdminEnvVarsDi;

    constructor(di: ISetAdminEnvVarsDi) {
        this.di = di;
    }

    async execute() {
        const { projectSdkParamsService } = this.di;
        const sdkParams = projectSdkParamsService.get();

        // Set basic admin env vars
        process.env.PORT = process.env.PORT || "3001";
        process.env.WEBINY_ADMIN_ENV = sdkParams.env;
        process.env.WEBINY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS =
            process.env.WEBINY_TRASH_BIN_RETENTION_PERIOD_DAYS || "";

        // Load Core app stack output
        const coreOutput = await getStackOutput<{
            deploymentId: string;
            cognitoUserPoolDomain?: string;
        }>({
            app: "core"
        });

        if (coreOutput) {
            process.env.WEBINY_ADMIN_DEPLOYMENT_ID = coreOutput.deploymentId;

            // Set Cognito user pool domain if available
            if (coreOutput.cognitoUserPoolDomain) {
                process.env.REACT_APP_USER_POOL_DOMAIN = coreOutput.cognitoUserPoolDomain;
            }
        }

        // Load API app stack output
        const apiOutput = await getStackOutput<{
            region: string;
            apiUrl: string;
            cognitoUserPoolId: string;
            cognitoAppClientId: string;
            cognitoUserPoolPasswordPolicy: any;
            websocketApiUrl: string;
        }>({
            app: "api"
        });

        if (apiOutput) {
            process.env.REACT_APP_USER_POOL_REGION = apiOutput.region;
            process.env.REACT_APP_GRAPHQL_API_URL = `${apiOutput.apiUrl}/graphql`;
            process.env.REACT_APP_API_URL = apiOutput.apiUrl;
            process.env.REACT_APP_USER_POOL_ID = apiOutput.cognitoUserPoolId;
            process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID = apiOutput.cognitoAppClientId;
            process.env.REACT_APP_USER_POOL_PASSWORD_POLICY = JSON.stringify(
                apiOutput.cognitoUserPoolPasswordPolicy
            );
            process.env.REACT_APP_WEBSOCKET_URL = apiOutput.websocketApiUrl;
        }
    }
}
