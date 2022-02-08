import { useContext } from "react";
import {
    AdminPageBuilderContext,
    AdminPageBuilderContextValue
} from "../contexts/AdminPageBuilder";

export function useAdminPageBuilder(): AdminPageBuilderContextValue {
    return useContext(AdminPageBuilderContext);
}
