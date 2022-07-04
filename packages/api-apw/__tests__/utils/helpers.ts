import { SecurityIdentity } from "@webiny/api-security/types";
import workflowMocks, { CreateWorkflowParams } from "../graphql/mocks/workflows";
import { Category } from "@webiny/api-page-builder/types";
import { ApwWorkflow, ApwWorkflowApplications } from "~/types";

export { until } from "@webiny/project-utils/testing/helpers/until";
export { sleep } from "@webiny/project-utils/testing/helpers/sleep";

export interface PermissionsArg {
    name: string;
    locales?: string[];
    rwd?: string;
    pw?: string;
    own?: boolean;
}

export const identity = {
    id: "12345678",
    displayName: "John Doe",
    type: "admin"
};

const getSecurityIdentity = () => {
    return identity;
};

export const createPermissions = (permissions?: PermissionsArg[]): PermissionsArg[] => {
    if (permissions) {
        return permissions;
    }
    return [
        {
            name: "cms.settings"
        },
        {
            name: "cms.contentModel",
            rwd: "rwd"
        },
        {
            name: "cms.contentModelGroup",
            rwd: "rwd"
        },
        {
            name: "cms.contentEntry",
            rwd: "rwd",
            pw: "rcpu"
        },
        {
            name: "cms.endpoint.read"
        },
        {
            name: "cms.endpoint.manage"
        },
        {
            name: "cms.endpoint.preview"
        },
        {
            name: "content.i18n",
            locales: ["en-US"]
        }
    ];
};

export const createIdentity = (identity?: SecurityIdentity) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return identity;
};

interface SetupCategoryParams {
    getCategory: ({ slug }: { slug: string }) => Promise<any>;
    createCategory: ({ data }: { data: Partial<Category> }) => Promise<any>;
}

export const setupCategory = async ({ getCategory, createCategory }: SetupCategoryParams) => {
    const [getCategoryResponse] = await getCategory({ slug: "static" });
    const category = getCategoryResponse.data.pageBuilder.getCategory.data;
    if (category) {
        return category;
    }
    const [createCategoryResponse] = await createCategory({
        data: {
            name: "Static",
            url: "/static/",
            slug: "static",
            layout: "static"
        }
    });
    return createCategoryResponse.data.pageBuilder.createCategory.data;
};

const setupReviewer = async (gqlHandler: any) => {
    await gqlHandler.securityIdentity.login();

    await gqlHandler.until(
        () => gqlHandler.reviewer.listReviewersQuery({}).then(([data]: any[]) => data),
        (response: any) => {
            return response.data.apw.listReviewers.data.length === 1;
        },
        {
            name: "Wait for listReviewer query"
        }
    );

    const [listReviewersResponse] = await gqlHandler.reviewer.listReviewersQuery({});
    const [reviewer] = listReviewersResponse.data.apw.listReviewers.data;
    return reviewer;
};

const setupPage = async (gqlHandler: any) => {
    const category = await setupCategory({
        getCategory: gqlHandler.getCategory,
        createCategory: gqlHandler.createCategory
    });

    const [createPageResponse] = await gqlHandler.createPage({ category: category.slug });
    return createPageResponse.data.pageBuilder.createPage.data;
};

export const setupDefaultWorkflow = async (
    gqlHandler: any,
    workflowParams: CreateWorkflowParams
): Promise<ApwWorkflow> => {
    const reviewer = await setupReviewer(gqlHandler);
    const [createWorkflowResponse] = await gqlHandler.createWorkflowMutation({
        data: workflowMocks.createWorkflowWithThreeSteps(workflowParams, [reviewer])
    });
    return createWorkflowResponse.data.apw.createWorkflow.data;
};

export const createSetupForPageContentReview = async (gqlHandler: any) => {
    const workflow = await setupDefaultWorkflow(gqlHandler, {
        app: ApwWorkflowApplications.PB
    });

    await gqlHandler.until(
        () => gqlHandler.listWorkflowsQuery({}).then(([data]: any) => data),
        (response: any) => {
            const list = response.data.apw.listWorkflows.data;
            return list.length === 1;
        },
        {
            name: "Wait for workflow entry to be available in list query before creating page."
        }
    );

    const page = await setupPage(gqlHandler);

    return {
        page,
        workflow,
        createPage: setupPage
    };
};

export const createPageContentReviewSetup = async (gqlHandler: any) => {
    const { page } = await createSetupForPageContentReview(gqlHandler);
    /*
     Create a content review entry.
    */
    const [createContentReviewResponse] = await gqlHandler.createContentReviewMutation({
        data: {
            content: {
                id: page.id,
                type: "page"
            }
        }
    });
    const contentReview = createContentReviewResponse.data.apw.createContentReview.data;
    return {
        contentReview
    };
};
