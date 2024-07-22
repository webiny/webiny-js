import { CmsIdentity } from "./identity";
import { CmsModelField, CmsModelFieldInput, LockedField } from "./modelField";
import { CmsModelGroup } from "./modelGroup";

/**
 * Base CMS Model. Should not be exported and used outside of this package.
 *
 * @category Database model
 * @category CmsModel
 */
export interface CmsModel {
    /**
     * Name of the content model.
     */
    name: string;
    /**
     * Unique ID for the content model. Created from name if not defined by user.
     */
    modelId: string;
    /**
     * Name of the content model in singular form to be used in the API.
     * example:
     * - Article
     * - Fruit
     * - Vegetable
     * - Car
     */
    singularApiName: string;
    /**
     * Name of the content model in plural form to be used in the API.
     * example:
     * - Articles
     * - Fruits
     * - Vegetables
     * - Cars
     */
    pluralApiName: string;
    /**
     * Model tenant.
     */
    tenant: string;
    /**
     * Locale this model belongs to.
     */
    locale: string;
    /**
     * Cms Group reference object.
     */
    group: CmsModelGroup;
    /**
     * Icon for the content model.
     */
    icon?: string | null;
    /**
     * Description for the content model.
     */
    description: string | null;
    /**
     * Date created
     */
    createdOn?: string;
    /**
     * Date saved. Changes on both save and create.
     */
    savedOn?: string;
    /**
     * CreatedBy object wrapper. Contains id, name and type of the user.
     */
    createdBy?: CmsIdentity;
    /**
     * List of fields defining entry values.
     */
    fields: CmsModelField[];
    /**
     * Admin UI field layout
     *
     * ```ts
     * layout: [
     *      [field1id, field2id],
     *      [field3id]
     * ]
     * ```
     */
    layout: string[][];
    /**
     * Models can be tagged to give them contextual meaning.
     */
    tags?: string[];
    /**
     * List of locked fields. Updated when entry is saved and a field has been used.
     */
    lockedFields?: LockedField[];
    /**
     * The field that is used as an entry title.
     * If not specified by the user, the system tries to assign the first available `text` field.
     */
    titleFieldId: string;
    /**
     * The field that is used as an entry description.
     * If not set by the user, the system will try to assign the first available `long-text` field.
     */
    descriptionFieldId?: string | null;
    /**
     * The field that is used as an entry image.
     * If not set by the user, the system will try to assign a `file` field which has `imagesOnly` enabled.
     */
    imageFieldId?: string | null;
    /**
     * The version of Webiny which this record was stored with.
     */
    webinyVersion: string;

    /**
     * Is model private?
     * This is meant to be used for some internal models - will not be visible in the schema.
     * Only available for the plugin constructed models.
     */
    isPrivate?: boolean;

    /**
     * Does this model require authorization to be performed?
     * Only available for models created via plugins.
     */
    authorization?: boolean | CmsModelAuthorization;

    /**
     * Is this model created via plugin?
     */
    isPlugin?: boolean;
}

export interface CmsModelAuthorization {
    permissions: boolean;

    [key: string]: any;
}

/**
 * A GraphQL `params.data` parameter received when creating content model.
 *
 * @category GraphQL params
 * @category CmsModel
 */
export interface CmsModelCreateInput {
    /**
     * Name of the content model.
     */
    name: string;
    /**
     * Singular name of the content model to be used in the API.
     */
    singularApiName: string;
    /**
     * Plural name of the content model to be used in the API.
     */
    pluralApiName: string;
    /**
     * Unique ID of the content model. Created from name if not sent by the user. Cannot be changed.
     */
    modelId?: string;
    /**
     * Description of the content model.
     */
    description?: string | null;
    /**
     * Group where to put the content model in.
     */
    group: string;
    /**
     * A list of content model fields to define the entry values.
     */
    fields?: CmsModelFieldInput[];
    /**
     * Admin UI field layout
     *
     * ```ts
     * layout: [
     *      [field1id, field2id],
     *      [field3id]
     * ]
     * ```
     */
    layout?: string[][];
    /**
     * Models can be tagged to give them contextual meaning.
     */
    tags?: string[];
    /**
     * Fields fieldId which are picked to represent the CMS entry.
     */
    titleFieldId?: string | null;
    descriptionFieldId?: string | null;
    imageFieldId?: string | null;
}

/**
 * A GraphQL `params.data` parameter received when creating content model from existing model.
 *
 * @category GraphQL params
 * @category CmsModel
 */
export interface CmsModelCreateFromInput extends CmsModelCreateInput {
    /**
     * Locale into which we want to clone the model into.
     */
    locale?: string;
}
