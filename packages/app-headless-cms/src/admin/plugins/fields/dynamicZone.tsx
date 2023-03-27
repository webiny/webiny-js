import React from "react";
import { ReactComponent as ObjectIcon } from "@material-design-icons/svg/outlined/dynamic_form.svg";
import { i18n } from "@webiny/app/i18n";
import { DynamicZone } from "~/admin/plugins/fields/dynamicZone/DynamicZone";
import { createFieldsList } from "~/admin/graphql/createFieldsList";
import { createTypeName } from "~/utils/createTypeName";
import { CmsEditorFieldTypePlugin, CmsModelFieldValidatorsGroup } from "~/types";
import { commonValidators } from "./dynamicZone/commonValidators";

const t = i18n.ns("app-headless-cms/admin/fields");

const listValidators: CmsModelFieldValidatorsGroup = {
    validators: commonValidators,
    title: "List validators",
    description: "These validators are applied to the entire dynamic zone."
};

export const dynamicZoneField: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-dynamic-zone",
    field: {
        type: "dynamicZone",
        label: t`Dynamic Zone`,
        description: t`Define content templates to be used during content creation.`,
        icon: <ObjectIcon />,
        allowMultipleValues: true,
        allowPredefinedValues: false,
        validators: field => {
            if (field.multipleValues) {
                return {
                    validators: ["dynamicZone"],
                    title: "Template Validators",
                    description: "Validators for each of the templates in this dynamic zone."
                };
            }

            return ["required"];
        },
        listValidators,
        canAccept(_, draggable) {
            return draggable.fieldType !== "dynamicZone";
        },
        multipleValuesLabel: t`Use as a list of values`,
        createField() {
            return {
                type: this.type,
                listValidation: [{ name: "dynamicZone" }],
                settings: {
                    templates: []
                },
                renderer: {
                    name: "dynamicZone"
                }
            };
        },
        render() {
            return <DynamicZone />;
        },
        graphql: {
            queryField({ model, field }) {
                const prefix = `${createTypeName(model.modelId)}_${buildTypeTree(model.fields, field.id)}`;
                const templates = field.settings?.templates || [];

                const fragments = templates.map(template => {
                    return `...on ${prefix}_${template.gqlTypeName} {
                        ${createFieldsList({ model, fields: template.fields || [] })}
                        _templateId
                        __typename
                    }`;
                });
                return `{ ${fragments.join("\n")} }`;
            }
        }
    }
};

function buildTypeTree(fields, id: string): string| void{
  const filter = fields.filter(field => field.id==id)
  if(filter.length>0){
     return createTypeName(filter[0].fieldId);
  }
  const result = parseObjects(fields, id) ?? parseDynamicZones(fields,id);
  if(result){
    return result
  }
}

function parseObjects(fields, id: string): string | void{
  const objects =  fields.filter(field => ["object"].includes(field.type));
  for(const object of objects){
     const result = buildTypeTree(object.settings.fields, id);
     if(result){
       return `${createTypeName(object.fieldId)}_${result}`
     }
  }
}

function parseDynamicZones(fields, id: string): string| void{
  const zones =  fields.filter(field => ["dynamicZone"].includes(field.type));
  for(const zone in zones){
     const result = parseTemplates(zone.settings.templates, id);
     if(result){
       return `${createTypeName(zone.fieldId)}_${result}`
     }
  }
}

function parseTemplates(templates, id: any): string| void{
  for(const template of templates){
     const result = buildTypeTree(template.fields, id);
     if(result){
       return `${template.gqlTypeName}_${result}`
     }
  }
}