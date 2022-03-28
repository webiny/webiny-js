import path from "path";
import { Node, Project, SourceFile, VariableDeclaration } from "ts-morph";

const extensions = [".js", ".ts", ".tsx"];

export const getModulePath = (modulePath: string) => {
    const filePath = modulePath.replace(/\\/g, "/");
    if (extensions.includes(path.extname(filePath))) {
        return filePath.split(".").slice(0, -1).join(".");
    }
    return filePath;
};

export const createMorphProject = (files: string[]) => {
    const project = new Project();
    for (const file of files) {
        project.addSourceFileAtPath(file);
    }
    return project;
};

export const getDeclaration = (name: string, source: SourceFile) => {
    const declaration = source.getFirstDescendant(node => {
        if (!Node.isVariableDeclaration(node)) {
            return false;
        }

        return node.getName() === name;
    }) as VariableDeclaration;

    if (!declaration) {
        throw Error(`Unable to find "${name}" declaration!`);
    }

    return declaration;
};

export const getSourceFile = (project: Project, file: string) => {
    if (!file) {
        console.log("File variable not sent.");
        return null;
    }

    const source = project.getSourceFile(file);
    if (source) {
        return source;
    }

    return null;
};
