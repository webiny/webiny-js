import { withStorage } from "@commodo/fields-storage";
import { compose } from "ramda";
import CustomDriver from "./CustomDriver";
import withId from "./withId";

const createModel = () =>
    compose(
        withId(),
        withStorage({
            driver: new CustomDriver()
        })
    )();

export default createModel;
