import { CmsGroupPlugin } from "@webiny/api-headless-cms/content/plugins/CmsGroupPlugin";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { PageDynamoDbAttributePlugin } from "~/plugins/definitions/PageDynamoDbAttributePlugin";
import contentModelPluginFactory from "./models/contentModelPluginFactory";
import { contentReviewModelDefinition } from "~/plugins/models/contentReview.model";
import { workflowModelDefinition } from "~/plugins/models/workflow.model";

const createApwModelGroup = () =>
    new ContextPlugin<CmsContext>(async context => {
        /**
         * This should never happen in the actual project.
         * It is to make sure that we load setup context before the CRUD init in our internal code.
         */
        if (!context.cms) {
            return;
        }
        context.security.disableAuthorization();
        /**
         * TODO:@ashutosh
         * We need to move these plugin in an installation plugin
         */
        const groupId = "contentModelGroup_apw";
        /**
         * Create a CmsGroup.
         */
        const cmsGroupPlugin = new CmsGroupPlugin({
            id: groupId,
            slug: "apw",
            name: "APW",
            description: "Group for Advanced Publishing Workflow"
        });

        /**
         * Create a CmsModel that represents "WorkFlow".
         */
        const cmsModelPlugin = contentModelPluginFactory({
            group: cmsGroupPlugin.contentModelGroup,
            tenant: context.tenancy.getCurrentTenant().id,
            locale: context.i18nContent.getLocale().code,
            modelDefinition: workflowModelDefinition
        });

        const contentReviewModelPlugin = contentModelPluginFactory({
            group: cmsGroupPlugin.contentModelGroup,
            tenant: context.tenancy.getCurrentTenant().id,
            locale: context.i18nContent.getLocale().code,
            modelDefinition: contentReviewModelDefinition
        });

        /**
         *  Register them so that they are accessible in cms context
         */
        context.plugins.register([cmsModelPlugin, cmsGroupPlugin, contentReviewModelPlugin]);

        context.security.enableAuthorization();
    });

/* This is DynamoDB only entity attribute.
 * TODO: Think on how to implement this generally, agnostic to the storage operation types.
 */
const createWorkflowFieldPlugin = () => {
    return new PageDynamoDbAttributePlugin({
        attribute: "workflow",
        params: {
            type: "string"
        }
    });
};

export default () => [createWorkflowFieldPlugin(), createApwModelGroup()];
