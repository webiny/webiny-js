import { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { CoreStackOutputService, ApiStackOutputService } from "../../../abstractions/index.js";

interface ISetAdminEnvVarsDi {
    projectSdkParamsService: ProjectSdkParamsService.Interface;
    coreStackOutputService: CoreStackOutputService.Interface;
    apiStackOutputService: ApiStackOutputService.Interface;
}

export class SetAdminEnvVars {
    di: ISetAdminEnvVarsDi;

    constructor(di: ISetAdminEnvVarsDi) {
        this.di = di;
    }

    async execute() {
        const { projectSdkParamsService, coreStackOutputService, apiStackOutputService } = this.di;
        const sdkParams = projectSdkParamsService.get();

        // Set basic admin env vars
        process.env.PORT = process.env.PORT || "3001";
        process.env.WBY_ADMIN_ENV = sdkParams.env;
        process.env.WBY_ADMIN_TRASH_BIN_RETENTION_PERIOD_DAYS =
            process.env.WBY_TRASH_BIN_RETENTION_PERIOD_DAYS || "";

        // Load Core app stack output (automatically uses env/variant/region from ProjectSdkParamsService)
        const coreOutput = await coreStackOutputService.execute<{
            deploymentId: string;
            cognitoUserPoolDomain?: string;
        }>();

        if (coreOutput) {
            process.env.WBY_ADMIN_DEPLOYMENT_ID = coreOutput.deploymentId;

            // Set Cognito user pool domain if available
            if (coreOutput.cognitoUserPoolDomain) {
                process.env.REACT_APP_USER_POOL_DOMAIN = coreOutput.cognitoUserPoolDomain;
            }
        }

        // Load API app stack output (automatically uses env/variant/region from ProjectSdkParamsService)
        const apiOutput = await apiStackOutputService.execute<{
            region: string;
            apiUrl: string;
            cognitoUserPoolId: string;
            cognitoAppClientId: string;
            cognitoUserPoolPasswordPolicy: any;
            websocketApiUrl: string;
        }>();

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
