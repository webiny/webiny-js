import { CmsApiModel, createCmsGroup, createCmsModel } from "~/plugins";
import { CmsModelField, CmsModelFieldValidation } from "~/types";
import ucFirst from "lodash/upperFirst";

interface CreateFieldInput
    extends Pick<
        CmsModelField,
        "id" | "fieldId" | "type" | "label" | "listValidation" | "validation" | "multipleValues"
    > {
    parentId?: string;
}

const createRequiredValidation = (): CmsModelFieldValidation => {
    return {
        name: "required",
        message: "Value is required."
    };
};
const createLteValidation = (value: string | number) => {
    return {
        name: "lte",
        message: `Value must be lesser than or equal to ${value}.`,
        settings: {
            value
        }
    };
};
const createGteValidation = (value: string | number) => {
    return {
        name: "gte",
        message: `Value must be greater than or equal to ${value}.`,
        settings: {
            value
        }
    };
};

export const createFieldId = (id: string, parentId?: string): string => {
    return [parentId, id].filter(Boolean).join("_");
};
export const createFieldFieldId = (id: string, parentId?: string): string => {
    if (!parentId) {
        return id;
    }
    return `${parentId}${ucFirst(id)}`;
};

const createField = (
    input: Partial<CmsModelField> & CreateFieldInput
): Omit<CmsModelField, "storageId"> => {
    const { parentId, ...field } = input;
    const id = createFieldId(field.id, parentId);
    const fieldId = createFieldFieldId(field.fieldId, parentId);
    return {
        ...field,
        id,
        fieldId,
        helpText: `Helper text for ${input.label}`,
        placeholderText: `A ${input.label} value`
    };
};

const createTextField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "title",
        type: "text",
        fieldId: "title",
        label: "Title",
        validation: [createRequiredValidation()],
        ...params
    });
};
const createBooleanField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "enabled",
        type: "boolean",
        fieldId: "enabled",
        label: "Enabled",
        validation: [createRequiredValidation()],
        ...params
    });
};
const createNumberField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "price",
        type: "number",
        fieldId: "price",
        label: "Price",
        validation: [
            createRequiredValidation(),
            {
                name: "gte",
                message: "Value must be greater than or equal to 1.",
                settings: {
                    value: 1
                }
            }
        ],
        ...params
    });
};

const createLongTextField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "description",
        type: "long-text",
        fieldId: "description",
        label: "Description",
        validation: [createRequiredValidation()],
        ...params
    });
};
const createRichTextField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "body",
        type: "rich-text",
        fieldId: "body",
        label: "Body",
        validation: [createRequiredValidation()],
        ...params
    });
};
const createDateField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "releaseDate",
        type: "datetime",
        fieldId: "releaseDate",
        label: "Release date",
        validation: [
            createRequiredValidation(),
            createGteValidation("2020-01-01"),
            createLteValidation("2023-12-31")
        ],
        settings: {
            type: "date"
        },
        ...params
    });
};
const createTimeField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "runningTime",
        type: "datetime",
        fieldId: "runningTime",
        label: "Running time",
        validation: [createRequiredValidation(), createGteValidation("00:30")],
        ...params
    });
};
const createDateTimeField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "lastPublishedOn",
        type: "datetime",
        fieldId: "lastPublishedOn",
        label: "Last published on",
        validation: [createRequiredValidation()],
        settings: {
            type: "dateTimeWithTimezone"
        },
        ...params
    });
};
const createFileField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "image",
        type: "file",
        fieldId: "image",
        label: "Image",
        validation: [createRequiredValidation()],
        ...params
    });
};

const createReferenceField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "category",
        type: "ref",
        fieldId: "category",
        label: "Category",
        validation: [createRequiredValidation()],
        settings: {
            modelId: "category"
        },
        ...params
    });
};

const createObjectField = (params: Partial<CreateFieldInput> = {}) => {
    const parentParams = {
        parentId: "nested"
    };
    return createField({
        id: "nested",
        type: "object",
        fieldId: "nested",
        label: "Nested",
        validation: [createRequiredValidation()],
        settings: {
            fields: [
                createTextField(parentParams),
                createLongTextField(parentParams),
                createRichTextField(parentParams),
                createNumberField(parentParams),
                createBooleanField(parentParams),
                createDateField(parentParams),
                createTimeField(parentParams),
                createDateTimeField(parentParams),
                createFileField(parentParams),
                createReferenceField(parentParams)
            ] as any
        },
        ...params
    });
};

const createFields = () => {
    return [
        createTextField(),
        createLongTextField(),
        createRichTextField(),
        createNumberField(),
        createBooleanField(),
        createDateField(),
        createTimeField(),
        createDateTimeField(),
        createFileField(),
        createReferenceField(),
        createObjectField()
    ];
};

const createLayout = (fields: Pick<CmsModelField, "id" | "settings">[]) => {
    return fields.reduce<string[][]>((layout, field) => {
        layout.push([field.id]);
        // object
        if (field.settings?.fields?.length) {
            layout.push(...createLayout(field.settings.fields));
        }
        return layout;
    }, []);
};

export const createModel = (): CmsApiModel => {
    const fields = createFields();
    return {
        modelId: "complexModel",
        group: {
            id: "validationstructuregroup",
            name: "Validation structure"
        },
        name: "Complex model",
        singularApiName: "ComplexModel",
        pluralApiName: "ComplexModels",
        description: "",
        fields,
        layout: createLayout(fields),
        titleFieldId: "title"
    };
};

export const createValidationStructure = () => {
    return [
        createCmsGroup({
            id: "validationstructuregroup",
            name: "Validation structure",
            slug: "validationstructuregroup",
            description: "Validation structure group description",
            icon: "fas/star"
        }),
        createCmsModel(createModel())
    ];
};
