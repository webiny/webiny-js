import { Klass, LexicalNode } from "lexical";
import { WebinyNodes } from "~/nodes/webinyNodes";

/**
 * Get the supported list of lexical nodes types.
 * These nodes are initialized in the lexical editor, for the page builder and headless CMS apps.
 */
export const getSupportedNodeList = (): ReadonlyArray<
    | Klass<LexicalNode>
    | {
          replace: Klass<LexicalNode>;
          with: <T extends { new (...args: any): any }>(node: InstanceType<T>) => LexicalNode;
      }
> => {
    return [...WebinyNodes];
};
