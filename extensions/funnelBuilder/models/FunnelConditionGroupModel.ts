import { FunnelConditionModel, FunnelConditionModelDto } from "./FunnelConditionModel";
import { getRandomId } from "../utils/getRandomId";

export type LogicalOperator = "and" | "or";
export type ConditionGroupItem = FunnelConditionModel | FunnelConditionGroupModel;

export interface FunnelConditionGroupModelDto {
    id: string;
    operator: LogicalOperator;
    items: Array<FunnelConditionModelDto | FunnelConditionGroupModelDto>;
}

export class FunnelConditionGroupModel {
    id: string;
    operator: LogicalOperator;
    items: Array<ConditionGroupItem>;

    constructor(dto?: FunnelConditionGroupModelDto) {
        this.id = dto?.id || getRandomId();
        this.operator = dto?.operator ?? "and";
        this.items = (dto?.items || []).map(item => {
            if ("sourceFieldId" in item) {
                return FunnelConditionModel.fromDto(item);
            }
            return FunnelConditionGroupModel.fromDto(item);
        });
    }

    toDto(): FunnelConditionGroupModelDto {
        return {
            id: this.id,
            operator: this.operator,
            items: this.items.map(item => {
                return item.toDto();
            })
        };
    }

    static fromDto(dto: FunnelConditionGroupModelDto): FunnelConditionGroupModel {
        return new FunnelConditionGroupModel(dto);
    }
}
