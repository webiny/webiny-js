import { Project } from "ts-morph";

export const createTsMorphProject = (files: string[]): Project => {
    const project = new Project();
    for (const file of files) {
        try {
            project.addSourceFileAtPath(file);
        } catch (e) {
            console.debug("Could not add %s file.", file);
        }
    }
    return project;
};
