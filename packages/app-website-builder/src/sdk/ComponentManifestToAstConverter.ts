import type { ComponentInput } from "./types";

export type InputAstNode = {
    name: string;
    type: string;
    list: boolean;
    path: string;
    children: InputAstNode[];
    input: ComponentInput;
};

export class ComponentManifestToAstConverter {
    static convert(inputs: ComponentInput[]): InputAstNode[] {
        return this.buildAst(inputs);
    }

    private static buildAst(inputs: ComponentInput[], basePath = ""): InputAstNode[] {
        return inputs.map(input => {
            const path = basePath ? `${basePath}/${input.name}` : input.name;
            const node: InputAstNode = {
                name: input.name,
                type: input.type,
                list: input.list || false,
                path,
                children: [],
                input
            };

            if (input.type === "object" && input.fields) {
                node.children = this.buildAst(input.fields, path);
            }

            return node;
        });
    }
}
