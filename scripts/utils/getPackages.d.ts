import { PackageJson, TsConfigJson } from "type-fest";

export interface Package {
    isTs: boolean;
    mustBuild: boolean;
    hasTests: boolean;
    name: string;
    folderName: string;
    packageFolder: string;
    packageFolderRelativePath: string;
    packageJsonPath: string;
    tsConfigJsonPath: string;
    tsConfigBuildJsonPath: string;
    packageJson: PackageJson;
    tsConfigJson: TsConfigJson;
    tsConfigBuildJson: TsConfigJson;
}

export interface GetPackagesParams {
    includes?: string[];
    excludes?: string[];
}

export function getPackages(params: GetPackagesParams): Package[];
