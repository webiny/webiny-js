import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "~/types";
import { PbContext } from "@webiny/api-page-builder/types";

export default () => {
    return new ContextPlugin<FormBuilderContext & PbContext>(
        async ({ formBuilder, pageBuilder }) => {
            /**
             * If page contains a form and the version of that form is "latest published revision",
             * then it should trigger re-render for all pages that contain that form.
             */
            formBuilder.onFormAfterPublish.subscribe(async ({ form }) => {
                await pageBuilder.prerendering.render({
                    tags: [{ tag: { key: "fb-form", value: form.formId } }]
                });
            });
        }
    );
};
