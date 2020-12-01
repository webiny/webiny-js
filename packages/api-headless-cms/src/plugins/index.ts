// import models from "./models";
import graphql from "./graphql";
import crud from "./crud";

// export default () => [models(), graphql()];
export default () => [graphql(), crud()];
