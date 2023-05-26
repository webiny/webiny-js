import { ContextPlugin } from "@webiny/api";
import { ApwContext } from "~/types";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import { WcpContextObject } from "@webiny/api-wcp/types";
import { WCP_FEATURE_LABEL } from "@webiny/wcp";

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

export const contextCommon = (): ContextPlugin<ApwContext>[] => {
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
        })
    ];
};

interface ContextTenantParams {
    identity?: SecurityIdentity;
}
export const contextSecurity = ({ identity }: ContextTenantParams): ContextPlugin<ApwContext>[] => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };

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
