import FormData from "./../components/FormData";
import ListData from "./../components/ListData";
import OptionsData from "./../components/OptionsData";

export default app => {
    app.modules.register([
        {
            name: "FormData",
            factory: () => FormData
        },
        {
            name: "ListData",
            factory: () => ListData
        },
        {
            name: "OptionsData",
            factory: () => OptionsData
        }
    ]);
};
