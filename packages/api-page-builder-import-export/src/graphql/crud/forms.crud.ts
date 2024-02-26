import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import { ContextPlugin } from "@webiny/api";
import {
    ImportExportTaskStatus,
    FormsImportExportCrud,
    PbImportExportContext,
    OnFormsBeforeExportTopicParams,
    OnFormsAfterExportTopicParams,
    OnFormsBeforeImportTopicParams,
    OnFormsAfterImportTopicParams
} from "~/types";
import { invokeHandlerClient } from "~/client";
import { Payload as CreateHandlerPayload } from "~/import/create";
import { initialStats } from "~/import/utils";
import { Payload as ExportFormsProcessHandlerPayload } from "~/export/process";
import { zeroPad } from "@webiny/utils";
import { FormsPermissions } from "@webiny/api-form-builder/plugins/crud/permissions/FormsPermissions";

const EXPORT_FORMS_FOLDER_KEY = "WEBINY_FB_EXPORT_FORM";
const EXPORT_FORMS_PROCESS_HANDLER = process.env.EXPORT_PROCESS_HANDLER as string;
const IMPORT_FORMS_CREATE_HANDLER = process.env.IMPORT_CREATE_HANDLER as string;

export default new ContextPlugin<PbImportExportContext>(context => {
    const formsPermissions = new FormsPermissions({
        getPermissions: () => context.security.getPermissions("fb.form"),
        getIdentity: context.security.getIdentity,
        fullAccessPermissionName: "pb.*"
    });

    // Export
    const onFormsBeforeExport = createTopic<OnFormsBeforeExportTopicParams>(
        "PageBuilder.onFormsBeforeExport"
    );
    const onFormsAfterExport = createTopic<OnFormsAfterExportTopicParams>(
        "PageBuilder.onFormsAfterExport"
    );

    // Import
    const onFormsBeforeImport = createTopic<OnFormsBeforeImportTopicParams>(
        "PageBuilder.onFormsBeforeImport"
    );
    const onFormsAfterImport = createTopic<OnFormsAfterImportTopicParams>(
        "PageBuilder.onFormsAfterImport"
    );

    context.waitFor("formBuilder", () => {
        const importExportCrud: FormsImportExportCrud = {
            onFormsBeforeExport,
            onFormsAfterExport,
            onFormsBeforeImport,
            onFormsAfterImport,
            async importForms(params) {
                const { zipFileUrl } = params;
                await formsPermissions.ensure({ rwd: "w" });

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
                await onFormsBeforeImport.publish({ params });
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
                await onFormsAfterImport.publish({ params });

                return {
                    task
                };
            },

            async exportForms(params) {
                const { ids: initialFormIds, revisionType } = params;
                await formsPermissions.ensure({ rwd: "w" });
                let formIds: string[] = initialFormIds || [];
                // If no ids are provided then it means we want to export all forms
                if (
                    !initialFormIds ||
                    (Array.isArray(initialFormIds) && initialFormIds.length === 0)
                ) {
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
                await onFormsBeforeExport.publish({ params });
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
                await onFormsAfterExport.publish({ params });

                return { task };
            }
        };
        // Modify context
        context.formBuilder.forms = importExportCrud;
    });
});
