import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import checkBasePermissions from "@webiny/api-page-builder/graphql/crud/utils/checkBasePermissions";
import { ImportExportTaskStatus, TemplatesImportExportCrud, PbImportExportContext } from "~/types";
import { invokeHandlerClient } from "~/client";
import { Payload as CreateHandlerPayload } from "~/import/create";
import { initialStats } from "~/import/utils";
import { Payload as ExportTemplatesProcessHandlerPayload } from "~/export/process";
import { EXPORT_TEMPLATES_FOLDER_KEY } from "~/export/utils";
import { zeroPad } from "@webiny/utils";

const PERMISSION_NAME = "pb.template";
const EXPORT_TEMPLATES_PROCESS_HANDLER = process.env.EXPORT_PROCESS_HANDLER as string;
const IMPORT_TEMPLATES_CREATE_HANDLER = process.env.IMPORT_CREATE_HANDLER as string;

export default new ContextPlugin<PbImportExportContext>(context => {
    const importExportCrud: TemplatesImportExportCrud = {
        async importTemplates({ zipFileUrl }) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            // Create a task for import template
            const task = await context.pageBuilder.importExportTask.createTask({
                status: ImportExportTaskStatus.PENDING,
                input: {
                    zipFileUrl
                }
            });
            /**
             * Import Templates
             * ImportTemplates
             * importTemplates
             */
            await invokeHandlerClient<CreateHandlerPayload>({
                context,
                name: IMPORT_TEMPLATES_CREATE_HANDLER,
                payload: {
                    zipFileUrl,
                    task,
                    type: "template",
                    identity: context.security.getIdentity()
                },
                description: "Import Templates - create"
            });

            return {
                task
            };
        },

        async exportTemplates({ ids: initialTemplateIds }) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            let templateIds: string[] = initialTemplateIds || [];
            // If no ids are provided then it means we want to export all templates
            if (
                !initialTemplateIds ||
                (Array.isArray(initialTemplateIds) && initialTemplateIds.length === 0)
            ) {
                templateIds = [];
                const templates = await context.pageBuilder.listPageTemplates();
                // Save template ids
                templates.forEach(template => templateIds.push(template.id));
            }

            if (templateIds.length === 0) {
                throw new WebinyError(
                    "Cannot export templates - no templates found for provided inputs.",
                    "EMPTY_EXPORT_NO_TEMPLATES_FOUND"
                );
            }

            // Create the main task for templates export.
            const task = await context.pageBuilder.importExportTask.createTask({
                status: ImportExportTaskStatus.PENDING
            });
            const exportTemplatesDataKey = `${EXPORT_TEMPLATES_FOLDER_KEY}/${task.id}`;
            // For each template create a sub task and invoke the process handler.
            for (let i = 0; i < templateIds.length; i++) {
                const templateId = templateIds[i];
                // Create sub task.
                await context.pageBuilder.importExportTask.createSubTask(
                    task.id,
                    zeroPad(i + 1, 5),
                    {
                        status: ImportExportTaskStatus.PENDING,
                        input: {
                            templateId,
                            exportTemplatesDataKey
                        }
                    }
                );
            }
            // Update main task status.
            await context.pageBuilder.importExportTask.updateTask(task.id, {
                status: ImportExportTaskStatus.PROCESSING,
                stats: initialStats(templateIds.length),
                input: {
                    exportTemplatesDataKey
                }
            });

            /**
             * Export Templates
             * ExportTemplates
             * exportTemplates
             */
            // Invoke handler.
            await invokeHandlerClient<ExportTemplatesProcessHandlerPayload>({
                context,
                name: EXPORT_TEMPLATES_PROCESS_HANDLER,
                payload: {
                    taskId: task.id,
                    subTaskIndex: 1,
                    type: "template",
                    identity: context.security.getIdentity()
                },
                description: "Export templates - process"
            });

            return { task };
        }
    };
    // Modify context
    context.pageBuilder.templates = importExportCrud;
});
