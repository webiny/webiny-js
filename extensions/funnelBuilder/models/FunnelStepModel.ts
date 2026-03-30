import { getRandomId } from "../utils/getRandomId";
import { AbstractModel } from "./AbstractModel";

export interface FunnelStepModelDto {
    id: string;
    title: string;
}

export class FunnelStepModel extends AbstractModel<FunnelStepModelDto> {
    id: string;
    title: string;

    constructor(dto?: FunnelStepModelDto) {
        super();
        this.id = dto?.id ?? getRandomId();
        this.title = dto?.title ?? "New page";
    }

    toDto(): FunnelStepModelDto {
        return {
            id: this.id,
            title: this.title
        };
    }

    static fromDto(dto: FunnelStepModelDto): FunnelStepModel {
        return new FunnelStepModel(dto);
    }
}
