import { ContextPlugin } from "@webiny/api";
import { PbContext } from "@webiny/api-page-builder/types";
import { FormBuilderContext } from "~/types";

export default () => {
    return new ContextPlugin<FormBuilderContext & PbContext>(
        async ({ formBuilder, pageBuilder }) => {
            /**
             * After a form was deleted, we want to rerender all published pages that include it.
             */
            formBuilder.onFormAfterDelete.subscribe(async ({ form }) => {
                await pageBuilder.prerendering.render({
                    tags: [{ tag: { key: "fb-form", value: form.formId } }]
                });
            });
        }
    );
};
