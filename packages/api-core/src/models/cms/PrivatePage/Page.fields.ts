import {
    createFieldDefinitions,
    type InferFieldSchema
} from "~/models/cms/FieldDefinitionsBuilder.js";

export const PageFieldDefinitions = createFieldDefinitions(fields => ({
    id: fields.text().required(),
    title: fields.text().label("Title").required(),
    path: fields.text().label("Path").required(),
    content: fields.text().label("Content")
}));

export type PageFieldsSchema = InferFieldSchema<typeof PageFieldDefinitions>;
