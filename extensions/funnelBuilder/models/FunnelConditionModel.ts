import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "./FunnelConditionOperatorModel";
import { AbstractModel } from "./AbstractModel";
import { getRandomId } from "../utils/getRandomId";

export interface FunnelConditionModelDto {
    id: string;
    sourceFieldId: string; // the field whose value we're checking
    operator: FunnelConditionOperatorModelDto; // the operator to use for comparison
}

export class FunnelConditionModel extends AbstractModel<FunnelConditionModelDto> {
    id: string;
    sourceFieldId: string;
    operator: FunnelConditionOperatorModel;

    constructor(dto?: Partial<FunnelConditionModelDto>) {
        super();
        this.id = dto?.id || getRandomId();
        this.sourceFieldId = dto?.sourceFieldId || "";
        this.operator = dto?.operator
            ? FunnelConditionOperatorModel.fromDto(dto.operator)
            : new FunnelConditionOperatorModel();
    }

    toDto(): FunnelConditionModelDto {
        return {
            id: this.id,
            sourceFieldId: this.sourceFieldId,
            operator: this.operator.toDto()
        };
    }

    static fromDto(dto: FunnelConditionModelDto): FunnelConditionModel {
        return new FunnelConditionModel(dto);
    }
}
