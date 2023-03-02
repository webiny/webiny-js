import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { checkBaseFormPermissions } from "@webiny/api-form-builder/plugins/crud/utils";
import { ImportExportTaskStatus, FormsImportExportCrud, PbImportExportContext } from "~/types";
import { invokeHandlerClient } from "~/client";
import { Payload as CreateHandlerPayload } from "~/import/create";
import { initialStats } from "~/import/utils";
import { Payload as ExportFormsProcessHandlerPayload } from "~/export/process";
import { EXPORT_FORMS_FOLDER_KEY } from "~/export/utils";
import { zeroPad } from "@webiny/utils";

const EXPORT_FORMS_PROCESS_HANDLER = process.env.EXPORT_PROCESS_HANDLER as string;
const IMPORT_FORMS_CREATE_HANDLER = process.env.IMPORT_CREATE_HANDLER as string;

export default new ContextPlugin<PbImportExportContext>(context => {
    const importExportCrud: FormsImportExportCrud = {
        async importForms({ zipFileUrl }) {
            await checkBaseFormPermissions(context, {
                rwd: "w"
            });

            // Create a task for import form
            const task = await context.pageBuilder.importExportTask.createTask({
                status: ImportExportTaskStatus.PENDING,
                input: {
                    zipFileUrl
                }
            });
            /**
             * Import Forms
             * ImportForms
             * importForms
             */
            await invokeHandlerClient<CreateHandlerPayload>({
                context,
                name: IMPORT_FORMS_CREATE_HANDLER,
                payload: {
                    zipFileUrl,
                    task,
                    type: "form",
                    identity: context.security.getIdentity()
                },
                description: "Import Forms - create"
            });

            return {
                task
            };
        },

        async exportForms({ ids: initialFormIds, revisionType }) {
            await checkBaseFormPermissions(context, {
                rwd: "w"
            });
            let formIds: string[] = initialFormIds || [];
            // If no ids are provided then it means we want to export all forms
            if (!initialFormIds || (Array.isArray(initialFormIds) && initialFormIds.length === 0)) {
                formIds = [];

                const forms = await context.formBuilder.listForms();

                // Save form ids
                forms.forEach(form => formIds.push(form.id));
            }

            if (formIds.length === 0) {
                throw new WebinyError(
                    "Cannot export forms - no forms found for provided inputs.",
                    "EMPTY_EXPORT_NO_FORMS_FOUND"
                );
            }

            // Create the main task for form export.
            const task = await context.pageBuilder.importExportTask.createTask({
                status: ImportExportTaskStatus.PENDING
            });
            const exportFormsDataKey = `${EXPORT_FORMS_FOLDER_KEY}/${task.id}`;
            // For each form create a sub task and invoke the process handler.
            for (let i = 0; i < formIds.length; i++) {
                const formId = formIds[i];
                // Create sub task.
                await context.pageBuilder.importExportTask.createSubTask(
                    task.id,
                    zeroPad(i + 1, 5),
                    {
                        status: ImportExportTaskStatus.PENDING,
                        input: {
                            formId,
                            exportFormsDataKey,
                            revisionType
                        }
                    }
                );
            }
            // Update main task status.
            await context.pageBuilder.importExportTask.updateTask(task.id, {
                status: ImportExportTaskStatus.PROCESSING,
                stats: initialStats(formIds.length),
                input: {
                    exportFormsDataKey,
                    revisionType
                }
            });

            /**
             * Export Forms
             * ExportForms
             * exportForms
             */
            // Invoke handler.
            await invokeHandlerClient<ExportFormsProcessHandlerPayload>({
                context,
                name: EXPORT_FORMS_PROCESS_HANDLER,
                payload: {
                    taskId: task.id,
                    subTaskIndex: 1,
                    type: "form",
                    identity: context.security.getIdentity()
                },
                description: "Export forms - process"
            });

            return { task };
        }
    };
    // Modify context
    context.formBuilder.forms = importExportCrud;
});
