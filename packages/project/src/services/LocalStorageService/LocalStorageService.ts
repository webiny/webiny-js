import { createImplementation } from "@webiny/di";
import { GetProjectService, LocalStorageService } from "~/abstractions/index.js";
import fs from "fs";

const LOCAL_STORAGE_FILENAME = "local.json";

export class DefaultLocalStorageService implements LocalStorageService.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    get(key?: string) {
        const ls = this.readLocalStorage();
        if (!key) {
            return ls;
        }
        return ls[key];
    }

    set(key: string, value: LocalStorageService.Value) {
        const ls = this.readLocalStorage();
        ls[key] = value;

        this.writeLocalStorage(ls);

        return ls;
    }

    unset(key: string) {
        const ls = this.readLocalStorage();
        delete ls[key];

        this.writeLocalStorage(ls);

        return ls;
    }

    private readLocalStorage() {
        const project = this.getProjectService.execute();
        const dataFilePath = project.paths.dotWebinyFolder.join(LOCAL_STORAGE_FILENAME).toString();

        if (!fs.existsSync(dataFilePath)) {
            return {};
        }

        try {
            return JSON.parse(fs.readFileSync(dataFilePath).toString()) as LocalStorageService.Data;
        } catch {
            throw new Error(
                `Could not parse Webiny CLI's locale storage data file located at ${dataFilePath}.`
            );
        }
    }

    private writeLocalStorage(data: LocalStorageService.Data) {
        const project = this.getProjectService.execute();
        const DOT_WEBINY = project.paths.dotWebinyFolder.toString();
        const dataFilePath = project.paths.dotWebinyFolder.join("local.json").toString();

        if (!fs.existsSync(DOT_WEBINY)) {
            fs.mkdirSync(DOT_WEBINY);
        }

        fs.writeFileSync(dataFilePath, JSON.stringify(data));
    }
}

export const localStorageService = createImplementation({
    abstraction: LocalStorageService,
    implementation: DefaultLocalStorageService,
    dependencies: [GetProjectService]
});
