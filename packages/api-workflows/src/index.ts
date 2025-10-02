import { createSchema } from "~/graphql/schema.js";
import { createContext } from "~/context/index.js";
import { createWorkflowModel } from "~/context/model.js";

export const createWorkflows = () => {
    return [createWorkflowModel(), createContext(), createSchema()];
};
