import DefaultFormLayout from "./DefaultFormLayout";
import "./styles.scss";

export default () => [
    {
        name: "form-layout-default",
        type: "form-layout",
        layout: {
            name: "default",
            title: "Default layout",
            component: DefaultFormLayout
        }
    }
];
