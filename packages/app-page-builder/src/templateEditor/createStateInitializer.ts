import omit from "lodash/omit";
import { templateAtom, PageTemplate, PageTemplateWithContent } from "~/templateEditor/state";
import { EditorStateInitializerFactory } from "~/editor/Editor";

export const createStateInitializer = (
    template: PageTemplateWithContent
): EditorStateInitializerFactory => {
    return () => ({
        content: template.content,
        recoilInitializer({ set }) {
            /**
             * We always unset the content because we are not using it via the template atom.
             */
            const templateData: PageTemplate = omit(template, ["content"]);

            set(templateAtom, templateData);
        }
    });
};
