import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/graphql/types";
import { FormBuilderContext } from "@webiny/api-form-builder/types";

export default () => {
    return new ContextPlugin<PbContext & FormBuilderContext>(
        async ({ pageBuilder, formBuilder }) => {
            /**
             * If page contains a form revision that has been unpublished,
             * then this hook should trigger re-render for all pages that contain that form revision.
             */
            formBuilder.onFormRevisionAfterDelete.subscribe(async ({ form }) => {
                await pageBuilder.prerendering.render({
                    tags: [{ tag: { key: "fb-form", value: form.formId } }]
                });
            });
        }
    );
};
