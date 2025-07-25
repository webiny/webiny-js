import type { VariantProps } from "~/utils";
import { previewVariants } from "./previews/variants";
import type { FileItemFormatted } from "../../domains";

/**
 * Default properties of a file preview component.
 * They are shared between the default and custom renderers.
 */
export interface FilePreviewDefaultProps
    extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
        VariantProps<typeof previewVariants> {
    onReplaceItem?: () => void;
    onRemoveItem?: () => void;
    onEditItem?: () => void;
    value: FileItemFormatted;
    disabled?: boolean;
}

/**
 * Properties that can be used to render a custom file preview component.
 * @see `renderFilePreview` property of the FilePickerPrimitiveProps.
 */
export type FilePreviewRendererProps = Omit<FilePreviewDefaultProps, "type"> & Record<string, any>;

/**
 * Default properties of a trigger component.
 * They are shared between the default and custom renderers.
 */
export interface TriggerDefaultProps extends React.HTMLAttributes<HTMLButtonElement> {
    disabled?: boolean;
    text?: string;
    onSelectItem: () => void;
}

/**
 * Properties that can be used to render a custom trigger component.
 * @see `renderTrigger` property of the FilePickerPrimitiveProps.
 */
export type TriggerRendererProps = TriggerDefaultProps & Record<string, any>;
