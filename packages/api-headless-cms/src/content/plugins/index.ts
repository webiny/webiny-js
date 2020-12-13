// import models from "./models";
// import modelFields from "./modelFields";
// import filterOperators from "./filterOperators";
// import graphqlFields from "./graphqlFields";
// import addRefFieldHooks from "./modelFields/refField/addRefFieldHooks";
// import checkRefFieldsBeforeSave from "./modelFields/refField/checkRefFieldsBeforeSave";
import contentModelManager from "./contentModelManager";

type HeadlessPluginsOptions = {
    type: string;
    environment: string;
    locale: string;
    dataManagerFunction?: string;
};

export default (options: HeadlessPluginsOptions) => [
    contentModelManager,
    // checkRefFieldsBeforeSave(),
    // addRefFieldHooks(),
    // models(),
    // modelFields,
    // graphqlFields
    // filterOperators()
];
