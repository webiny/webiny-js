import { createConfigPortal } from "~/utils/createConfigPortal";

const { ConfigApply, Config } = createConfigPortal("Editor");

export const EditorConfig = Config;
export const EditorConfigApply = ConfigApply;
