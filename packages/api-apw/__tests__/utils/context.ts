import { ContextPlugin } from "@webiny/handler";
import { ApwContext } from "~/types";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { WcpContextObject } from "@webiny/api-wcp/types";
import { WCP_FEATURE_LABEL } from "../../../wcp/src";

const createCanUseFeature = (wcp?: WcpContextObject) => {
    const defaultCanUseFeature = wcp?.canUseFeature;
    return (featureId: keyof typeof WCP_FEATURE_LABEL) => {
        if (featureId === "advancedPublishingWorkflow") {
            return true;
        } else if (defaultCanUseFeature) {
            return defaultCanUseFeature.apply(wcp, [featureId]);
        }
        return false;
    };
};

interface ContextCommonParams {
    path: string;
}
export const contextCommon = ({ path }: ContextCommonParams): ContextPlugin<ApwContext>[] => {
    return [
        /**
         * Setup dummy wcp canUseFeature
         */
        new ContextPlugin<ApwContext>(async context => {
            const canUseFeature = createCanUseFeature(context.wcp);
            context.wcp = {
                ...(context.wcp || {}),
                canUseFeature
            };
        }),
        /**
         * Setup dummy request
         */
        new ContextPlugin<ApwContext>(async context => {
            context.http = {
                ...(context?.http || {}),
                request: {
                    ...(context?.http?.request || {}),
                    headers: {
                        ...(context?.http?.request?.headers || {}),
                        ["x-tenant"]: "root"
                    },
                    path: {
                        ...(context?.http?.request?.path || {}),
                        parameters: {
                            ...(context?.http?.request?.path?.parameters || {}),
                            key: path
                        }
                    }
                }
            };
        })
    ];
};

interface ContextTenantParams {
    tenant: Pick<Tenant, "id" | "name" | "parent">;
    identity?: SecurityIdentity;
}
export const contextSecurity = ({
    tenant,
    identity
}: ContextTenantParams): ContextPlugin<ApwContext>[] => {
    return [
        new ContextPlugin<ApwContext>(async context => {
            context.security.getApiKeyByToken = async (token: string): Promise<ApiKey | null> => {
                if (!token || token !== "aToken") {
                    return null;
                }
                const apiKey = "a1234567890";
                return {
                    id: apiKey,
                    name: apiKey,
                    tenant: tenant.id,
                    permissions: identity?.["permissions"] || [],
                    token,
                    createdBy: {
                        id: "test",
                        displayName: "test",
                        type: "admin"
                    },
                    description: "test",
                    createdOn: new Date().toISOString(),
                    webinyVersion: context.WEBINY_VERSION
                };
            };
        })
    ];
};
