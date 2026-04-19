// Side-effect imports to pull in IFieldRendererRegistry augmentations.
// Each renderer file declares its registry entry via `declare module`.
import "../../base/Base/FieldRenderers/InputRenderer.js";
import "../../base/Base/FieldRenderers/SelectRenderer.js";
import "../../base/Base/FieldRenderers/ObjectRenderer/ObjectRenderer.js";
import "../../base/Base/FieldRenderers/ObjectRenderer/ObjectListFlatRenderer.js";
import "../../base/Base/FieldRenderers/PassthroughRenderer.js";
import "../../base/Base/FieldRenderers/TextareaRenderer.js";
