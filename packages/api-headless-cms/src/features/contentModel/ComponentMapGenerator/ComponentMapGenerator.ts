import {
    ComponentMapGenerator as Abstraction,
    type IComponentMapGenerator
} from "./abstractions.js";
import { ModelToAstConverter } from "../ModelToAstConverter/abstractions.js";
import type {
    CmsModel,
    CmsModelAst,
    CmsModelFieldAstNode,
    CmsModelFieldAstNodeCollection
} from "~/types/index.js";

class ComponentMapGeneratorImpl implements IComponentMapGenerator {
    constructor(private readonly modelToAst: ModelToAstConverter.Interface) {}

    generate(model: CmsModel): Record<string, string> {
        const ast = this.modelToAst.toAst(model);
        const map: Record<string, string> = {};
        this.walkNode(ast, map);
        return map;
    }

    private walkNode(node: CmsModelAst | CmsModelFieldAstNode, map: Record<string, string>) {
        for (const child of node.children) {
            if (child.type === "collection") {
                this.walkCollection(child, map);
            } else {
                this.walkNode(child, map);
            }
        }
    }

    private walkCollection(node: CmsModelFieldAstNodeCollection, map: Record<string, string>) {
        const { collection } = node;
        if (collection.componentName && collection.id) {
            map[collection.id] = collection.componentName;
        }

        for (const child of node.children) {
            if (child.type === "collection") {
                this.walkCollection(child, map);
            } else {
                this.walkNode(child, map);
            }
        }
    }
}

export const ComponentMapGenerator = Abstraction.createImplementation({
    implementation: ComponentMapGeneratorImpl,
    dependencies: [ModelToAstConverter]
});
