export type Package = {
    name: string,
    location: string,
    packageJSON: Object
};

export type Params = {
    packages: Array<Package>,
    logger: { log: Function, error: Function },
    config: {
        ci: Boolean,
        preview: Boolean,
        repositoryUrl: string,
        branch: string,
        tagFormat: string | ((pkg: Package) => string)
    }
};

export type Plugin = (params: Params, next: Function, finish: Function) => void;
