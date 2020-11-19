import crud from "./crud";
import graphql from "./graphql";
import fileManagerContext from "./fileManagerContext";

export default (): any => [crud, graphql, fileManagerContext];
