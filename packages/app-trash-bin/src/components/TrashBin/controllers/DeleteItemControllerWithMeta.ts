import { makeAutoObservable } from "mobx";
import { IDeleteItemController } from "../abstractions";
import { IMetaRepository } from "@webiny/app-utilities";

export class DeleteItemControllerWithMeta implements IDeleteItemController {
    private metaRepository: IMetaRepository;
    private deleteItemController: IDeleteItemController;

    constructor(metaRepository: IMetaRepository, deleteItemController: IDeleteItemController) {
        this.metaRepository = metaRepository;
        this.deleteItemController = deleteItemController;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        await this.deleteItemController.execute(id);
        await this.metaRepository.decreaseTotalCount();
    }
}
