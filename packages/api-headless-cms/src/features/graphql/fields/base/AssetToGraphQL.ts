import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import type { GraphQLSchemaDefinition } from "@webiny/api-graphql/types.js";
import type { CmsContext } from "~/types/types.js";
import { createGraphQLInputField } from "./utils/createGraphQLInputField.js";
import { resolveAssetUrl } from "../../../modelBuilder/fields/resolveAssetUrl.js";

// --- Image sub-type (self-contained block for future registry extraction) ---

const imageTypeDefs = /* GraphQL */ `
    type FmAssetCrop {
        top: Number
        left: Number
        bottom: Number
        right: Number
    }

    type FmAssetFocalPoint {
        x: Number
        y: Number
    }

    type FmAssetImage {
        width: Number
        height: Number
        crop: FmAssetCrop
        focalPoint: FmAssetFocalPoint
        alt: String
        caption: String
    }

    input FmAssetCropInput {
        top: Number
        left: Number
        bottom: Number
        right: Number
    }

    input FmAssetFocalPointInput {
        x: Number
        y: Number
    }

    input FmAssetImageInput {
        width: Number
        height: Number
        crop: FmAssetCropInput
        focalPoint: FmAssetFocalPointInput
        alt: String
        caption: String
    }
`;

// --- Document sub-type ---

const documentTypeDefs = /* GraphQL */ `
    type FmAssetDocument {
        pages: Number
    }

    input FmAssetDocumentInput {
        pages: Number
    }
`;

// --- Video sub-type ---

const videoTypeDefs = /* GraphQL */ `
    type FmAssetVideo {
        autoplay: Boolean
        poster: String
    }

    input FmAssetVideoInput {
        autoplay: Boolean
        poster: String
    }
`;

// --- Base asset type ---

const baseTypeDefs = /* GraphQL */ `
    type FmAsset {
        id: String!
        src: String!
        url: String
        name: String!
        type: String!
        size: Number!
        image: FmAssetImage
        document: FmAssetDocument
        video: FmAssetVideo
    }

    input FmAssetInput {
        id: String!
        src: String!
        # TODO: figure out how to remove this from here, as this is a derived read-only value.
        url: String
        name: String!
        type: String!
        size: Number!
        image: FmAssetImageInput
        document: FmAssetDocumentInput
        video: FmAssetVideoInput
    }
`;

const allTypeDefs = [imageTypeDefs, documentTypeDefs, videoTypeDefs, baseTypeDefs].join("\n");

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        if (field.list) {
            return `${field.fieldId}: [FmAsset]`;
        }
        return `${field.fieldId}: FmAsset`;
    }

    public createResolver(): CmsModelFieldToGraphQL.Resolver {
        return {
            resolver: null,
            typeResolvers: {
                FmAsset: {
                    url: (parent: any) => resolveAssetUrl(parent)
                }
            }
        };
    }

    public createSchema(): GraphQLSchemaDefinition<CmsContext> {
        return {
            typeDefs: allTypeDefs,
            resolvers: {}
        };
    }
}

class ManageApi extends ReadApi implements CmsModelFieldToGraphQL.ManageApi {
    public createInputField({ field }: CmsModelFieldToGraphQL.TypeFieldParams): string {
        return createGraphQLInputField(field, "FmAssetInput");
    }
}

class AssetToGraphQL implements CmsModelFieldToGraphQL.Interface {
    public readonly read = new ReadApi();
    public readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "asset";
    public readonly isSearchable: boolean = false;
    public readonly isSortable: boolean = false;
    public readonly isFullTextSearchable: boolean = false;

    public getReadApi(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManageApi(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }
}

export const AssetFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: AssetToGraphQL,
    dependencies: []
});
