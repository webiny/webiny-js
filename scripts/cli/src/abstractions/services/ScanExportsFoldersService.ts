import { Abstraction } from "@webiny/di";
import { ListPackagesService } from "./ListPackagesService.js";

export interface ExportFile {
  relativePath: string;
  packageName: string;
  absolutePath: string;
}

export interface IScanExportsFoldersService {
  execute(packages: ListPackagesService.Package[]): Map<string, ExportFile[]>;
}

export const ScanExportsFoldersService = new Abstraction<
  IScanExportsFoldersService
>("ScanExportsFoldersService");

export namespace ScanExportsFoldersService {
  export type Interface = IScanExportsFoldersService;
  export type ExportFile = ExportFile;
}
