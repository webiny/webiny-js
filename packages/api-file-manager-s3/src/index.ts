import graphqlFileStorageS3 from "./plugins/graphqlFileStorageS3";
import fileStorageS3 from "./plugins/fileStorageS3";

export default () => [fileStorageS3(), graphqlFileStorageS3];

export { createFileUploadModifier } from "./utils/FileUploadModifier";
