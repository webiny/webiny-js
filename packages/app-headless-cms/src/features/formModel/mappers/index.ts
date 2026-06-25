import type { ICmsFieldTypeMapper } from "../abstractions.js";
import { TextFieldMapper, LongTextFieldMapper, JsonFieldMapper } from "./TextFieldMapper.js";
import { NumberFieldMapper } from "./NumberFieldMapper.js";
import { BooleanFieldMapper } from "./BooleanFieldMapper.js";
import { DateTimeFieldMapper } from "./DateTimeFieldMapper.js";
import { FileFieldMapper } from "./FileFieldMapper.js";
import { RichTextFieldMapper } from "./RichTextFieldMapper.js";
import { ObjectFieldMapper } from "./ObjectFieldMapper.js";
import { DynamicZoneFieldMapper } from "./DynamicZoneFieldMapper.js";
import { RefFieldMapper } from "./RefFieldMapper.js";

export function createBuiltInMappers(): ICmsFieldTypeMapper[] {
    return [
        new TextFieldMapper(),
        new LongTextFieldMapper(),
        new JsonFieldMapper(),
        new NumberFieldMapper(),
        new BooleanFieldMapper(),
        new DateTimeFieldMapper(),
        new FileFieldMapper(),
        new RichTextFieldMapper(),
        new ObjectFieldMapper(),
        new DynamicZoneFieldMapper(),
        new RefFieldMapper()
    ];
}
