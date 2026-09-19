import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const ADMIN_COMPONENT_MODEL_ID = "wbyAdminComponent";

/**
 * Where a generated admin component lives.
 *
 * Private, so it stays out of the content models an editor sees and out of the list the assistant
 * gets from `listContentModels`. That last part matters: the assistant must reach these through the
 * dedicated tool, which controls what a component may contain, rather than through the generic
 * entry tools, which would let it write any string it liked into `source`.
 *
 * Its own model rather than a corner of the website builder's component storage. The two have
 * nothing in common but the word "component" — this one is admin UI, evaluated in the admin app,
 * against `admin-ui` and the form model.
 */
class AdminComponentModelFactory implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        const model = builder.private({
            modelId: ADMIN_COMPONENT_MODEL_ID,
            name: "AI Power-ups - Admin Component"
        });

        model.fields(fields => ({
            /* What the component extends. Only `fieldRenderer` is loaded today. */
            kind: fields.text().label("Kind"),
            /* The renderer name a field asks for, e.g. `menuBuilder`. Unique per kind, in practice. */
            name: fields.text().label("Name"),
            /* Short human label for the renderer list; `description` is the line under it. */
            label: fields.text().label("Label"),
            description: fields.text().label("Description"),
            /*
             * Which fields may select this renderer, in the CMS field editor's Appearance tab.
             * `fieldType` is a CMS field type (`text`, `object`, ...) and `appliesTo` is
             * single/list/both. Without these a renderer would be offered on every field, including
             * the ones whose value shape it cannot read.
             */
            fieldType: fields.text().label("Field type"),
            appliesTo: fields.text().label("Applies to"),
            /* TSX, as written. Transpiled in the browser, never on the way in. */
            source: fields.longText().label("Source"),
            enabled: fields.boolean().label("Enabled")
        }));

        return [model];
    }
}

export const AdminComponentModelPlugin = ModelFactory.createImplementation({
    implementation: AdminComponentModelFactory,
    dependencies: []
});
