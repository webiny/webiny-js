declare module "@webiny/cli/utils" {
    function getProject(args?: any): {
        name: string;
        root: string;
        config: any;
    };

    const log: any;
}
