import { ContextPlugin } from "@webiny/api";
import { PbContext } from "@webiny/api-page-builder/types";
import { FormBuilderContext } from "~/types";

export default () => {
    return new ContextPlugin<FormBuilderContext & PbContext>(
        async ({ formBuilder, pageBuilder }) => {
            /**
             * If page contains a form revision that has been unpublished or deleted,
             * then this hook should trigger re-render for all pages that contain that form revision.
             */
            formBuilder.onFormRevisionAfterDelete.subscribe(async ({ form }) => {
                await pageBuilder.prerendering.render({
                    tags: [{ tag: { key: "fb-form-revision", value: form.id } }]
                });
            });
        }
    );
};
