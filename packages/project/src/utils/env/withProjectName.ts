import { createConfiguration } from "./configuration.js";
import { type ProjectModel } from "~/models/index.js";

export interface IWithProjectNameParams {
    project: ProjectModel;
}

export const withProjectName = ({ project }: IWithProjectNameParams) => {
    return createConfiguration(() => {
        return {
            WBY_PROJECT_NAME: project.name
        };
    });
};
