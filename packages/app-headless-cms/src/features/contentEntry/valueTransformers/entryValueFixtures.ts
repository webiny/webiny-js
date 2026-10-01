import type { CmsDynamicZoneTemplate, CmsModel, CmsModelField } from "~/types.js";

/**
 * Shared fixtures for value transformer and gateway tests.
 * The model mirrors a real "page" model: a list dynamic zone field with templates
 * that contain nested object fields.
 */
export const createField = (field: Partial<CmsModelField>): CmsModelField => {
    return {
        id: field.fieldId,
        label: field.fieldId,
        ...field
    } as CmsModelField;
};

export const heroTemplate: CmsDynamicZoneTemplate = {
    id: "heroBlock",
    name: "Hero Block",
    gqlTypeName: "PageHeroBlock",
    description: "",
    icon: "fas/star",
    layout: [],
    validation: [],
    fields: [
        createField({ fieldId: "title", type: "text" }),
        createField({
            fieldId: "customUrls",
            type: "object",
            list: true,
            settings: {
                fields: [createField({ fieldId: "ctaUrl", type: "text" })]
            }
        })
    ]
};

export const galleryTemplate: CmsDynamicZoneTemplate = {
    id: "galleryBlock",
    name: "Gallery Block",
    gqlTypeName: "PageGalleryBlock",
    description: "",
    icon: "fas/image",
    layout: [],
    validation: [],
    fields: [
        createField({ fieldId: "header", type: "text" }),
        createField({
            fieldId: "gallery",
            type: "object",
            list: true,
            settings: {
                fields: [createField({ fieldId: "image", type: "file" })]
            }
        })
    ]
};

export const blocksField = createField({
    fieldId: "blocks",
    type: "dynamicZone",
    list: true,
    settings: {
        templates: [heroTemplate, galleryTemplate]
    }
});

export const singleBlockField = createField({
    fieldId: "featuredBlock",
    type: "dynamicZone",
    list: false,
    settings: {
        templates: [heroTemplate]
    }
});

export const metaTitleField = createField({ fieldId: "metaTitle", type: "text" });

export const pageModel = {
    modelId: "page",
    name: "Page",
    singularApiName: "Page",
    pluralApiName: "Pages",
    fields: [metaTitleField, blocksField, singleBlockField],
    layout: [],
    tags: []
} as unknown as CmsModel;

/**
 * Values in the shape the entry form holds them.
 */
export const formValues = {
    metaTitle: "Home",
    blocks: [
        {
            _templateId: "heroBlock",
            _id: "hero-1",
            title: "Sunnyvale",
            customUrls: [{ _id: "url-1", ctaUrl: "/memberships-passes/" }]
        },
        {
            _templateId: "galleryBlock",
            _id: "gallery-1",
            header: "Gallery",
            gallery: [{ _id: "image-1", image: "https://example.com/1.jpg" }]
        }
    ],
    featuredBlock: {
        _templateId: "heroBlock",
        _id: "featured-1",
        title: "Featured",
        customUrls: []
    }
};

/**
 * The same values in the shape the GraphQL `<Model>Input` type expects.
 */
export const graphQLInputValues = {
    metaTitle: "Home",
    blocks: [
        {
            PageHeroBlock: {
                title: "Sunnyvale",
                customUrls: [{ ctaUrl: "/memberships-passes/" }]
            }
        },
        {
            PageGalleryBlock: {
                header: "Gallery",
                gallery: [{ image: "https://example.com/1.jpg" }]
            }
        }
    ],
    featuredBlock: {
        PageHeroBlock: {
            title: "Featured",
            customUrls: []
        }
    }
};
