import graphqlFileStorageS3 from "./plugins/graphqlFileStorageS3";
import fileStorageS3 from "./plugins/fileStorageS3";
import { addFileMetadata } from "./plugins/addFileMetadata";

export { createFileUploadModifier } from "./utils/FileUploadModifier";
export { createAssetDelivery } from "./assetDelivery/createAssetDelivery";

export default () => [fileStorageS3(), graphqlFileStorageS3, addFileMetadata()];
