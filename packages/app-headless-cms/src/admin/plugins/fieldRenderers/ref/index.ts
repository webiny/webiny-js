import refInput from "./refInput";
import refInputs from "./refInputs";
import { createAdvancedRefRenderer } from "./advanced";
import { createSimpleRefRenderer } from "./simple";

export default [...createAdvancedRefRenderer(), refInput, refInputs, ...createSimpleRefRenderer()];
