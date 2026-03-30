import { RequiredValidator } from "./RequiredValidator";
import { GteValidator } from "./GteValidator";
import { LteValidator } from "./LteValidator";
import { MaxLengthValidator } from "./MaxLengthValidator";
import { MinLengthValidator } from "./MinLengthValidator";
import { PatternValidator } from "./PatternValidator";

export const registry = [
    GteValidator,
    LteValidator,
    MaxLengthValidator,
    MinLengthValidator,
    PatternValidator,
    RequiredValidator
];
