import { Klass, LexicalNode } from "lexical";

export type Configuration = {
    nodes?: ReadonlyArray<
        | Klass<LexicalNode>
        | {
              replace: Klass<LexicalNode>;
              with: <T extends { new (...args: any): any }>(node: InstanceType<T>) => LexicalNode;
          }
    >;
};
