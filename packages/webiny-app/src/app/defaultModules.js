export default app => {
    app.modules.register([
        {
            name: "FormData",
            factory: () => import("./../components/FormData")
        },
        {
            name: "ListData",
            factory: () => import("./../components/ListData")
        },
        {
            name: "OptionsData",
            factory: () => import("./../components/OptionsData")
        }
    ]);
};
