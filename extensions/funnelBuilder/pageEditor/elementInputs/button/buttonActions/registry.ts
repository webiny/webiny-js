import type { ButtonActionDefinition } from "../types";
import { previousStepButtonAction } from "./previousStepButtonAction";
import { nextStepButtonAction } from "./nextStepButtonAction";
import { validateStepButtonAction } from "./validateStepButtonAction";
import { saveUserToCrmButtonAction } from "./saveUserToCrmButtonAction";

export const buttonActionsRegistry: ButtonActionDefinition[] = [
    previousStepButtonAction,
    nextStepButtonAction,
    validateStepButtonAction,
    saveUserToCrmButtonAction
];
