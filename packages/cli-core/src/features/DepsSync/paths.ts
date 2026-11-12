import { IProjectModel } from "@webiny/project";

export const getReferencesFilePath = (project: IProjectModel) => {
    return project.paths.rootFolder.join("packages/references/references.json").toString();
};

export const getDuplicatesFilePath = (project: IProjectModel) => {
    return project.paths.rootFolder.join("packages/cli-core/files/duplicates.json").toString();
};
