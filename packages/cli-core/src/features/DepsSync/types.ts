import type { PackageJson } from "type-fest";

export enum PackageType {
    dependencies = "dependencies",
    devDependencies = "devDependencies",
    peerDependencies = "peerDependencies",
    resolutions = "resolutions"
}

export interface IReferenceVersionFile {
    file: string;
    types: PackageType[];
}

export interface IReferenceVersion {
    version: string;
    files: IReferenceVersionFile[];
}

export interface IReference {
    name: string;
    versions: IReferenceVersion[];
}

export interface IDependency {
    name: string;
    version: string;
    files: string[];
}

export interface IDependencyTreePushParams {
    file: string;
    json: PackageJson;
    ignore?: RegExp;
}

export interface IDependencyCollection {
    dependencies: IDependency[];
    devDependencies: IDependency[];
    peerDependencies: IDependency[];
    resolutions: IDependency[];
    references: IReference[];
}

export interface IDependencyTree {
    dependencies: IDependency[];
    devDependencies: IDependency[];
    peerDependencies: IDependency[];
    resolutions: IDependency[];
    references: IReference[];
    duplicates: IReference[];

    push(params: IDependencyTreePushParams): void;
}
