import refInput from "./refInput";
import refInputs from "./refInputs";
import { createAdvancedRefRender } from "~/admin/plugins/fieldRenderers/ref/advanced";

export default [...createAdvancedRefRender(), refInput, refInputs];
