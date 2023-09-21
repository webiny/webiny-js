import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "~/types";
import { PbContext } from "@webiny/api-page-builder/types";

export default () => {
    return new ContextPlugin<FormBuilderContext & PbContext>(
        async ({ formBuilder, pageBuilder }) => {
            /**
             * After a form was published, we want to rerender all published pages that include it.
             */
            formBuilder.onFormAfterPublish.subscribe(async ({ form }) => {
                await pageBuilder.prerendering.render({
                    tags: [{ tag: { key: "fb-form", value: form.formId } }]
                });
            });
        }
    );
};
