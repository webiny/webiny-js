import graphql from "./graphql";
import filesCRUD from "./crud/files.crud";
import fileValidationPlugin from "./crud/files/validation";
import settingsCRUD from "./crud/settings.crud";
import systemCRUD from "./crud/system.crud";
import storage from "./storage";

export default () => [
    systemCRUD,
    settingsCRUD,
    filesCRUD,
    storage,
    graphql,
    fileValidationPlugin()
];
