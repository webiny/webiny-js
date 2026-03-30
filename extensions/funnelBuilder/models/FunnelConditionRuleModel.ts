import {
    FunnelConditionGroupModel,
    FunnelConditionGroupModelDto
} from "./FunnelConditionGroupModel";
import {
    FunnelConditionActionModel,
    FunnelConditionActionModelDto
} from "./FunnelConditionActionModel";
import { getRandomId } from "../utils/getRandomId";
import { FunnelModel } from "./FunnelModel";

export interface FunnelConditionRuleModelDto {
    id: string;
    // Root condition group.
    conditionGroup: FunnelConditionGroupModelDto;
    actions: FunnelConditionActionModelDto[];
}

export class FunnelConditionRuleModel {
    funnel: FunnelModel;
    id: string;
    // Root condition group.
    conditionGroup: FunnelConditionGroupModel;
    actions: FunnelConditionActionModel[];

    constructor(funnel: FunnelModel, dto?: FunnelConditionRuleModelDto) {
        this.funnel = funnel;
        this.id = dto?.id || getRandomId();
        this.conditionGroup = new FunnelConditionGroupModel(dto?.conditionGroup);
        this.actions = (dto?.actions || []).map(action => {
            return FunnelConditionActionModel.fromDto(this, action);
        });
    }

    toDto(): FunnelConditionRuleModelDto {
        return {
            id: this.id,
            conditionGroup: this.conditionGroup.toDto(),
            actions: this.actions.map(action => action.toDto())
        };
    }

    static fromDto(funnel: FunnelModel, dto: FunnelConditionRuleModelDto) {
        return new FunnelConditionRuleModel(funnel, dto);
    }
}
