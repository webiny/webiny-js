// Repository-relative path of a script in `runNodeScripts`, by its name without the extension.
export const nodeScriptPath = (name: string) => {
    return `.github/workflows/wac/utils/runNodeScripts/${name}.js`;
};
