import { react } from "./react";
import { babel } from "./babel";
import { awsSdk } from "./awsSdk";
import { jest } from "./jest";
import { pulumi } from "./pulumi";
import { fastify } from "./fastify";
import { rmwc } from "./rmwc";
import { lexical } from "./lexical";
import { ts } from "./ts";
import { graphql } from "./graphql";
import { eslint } from "./eslint";
import { prettier } from "./prettier";
import { vitest } from "./vitest";
import { storybook } from "./storybook";
import { emotion } from "./emotion.js";
import { fontawesome } from "./fontawesome.js";

export const presets = [
    react,
    babel,
    awsSdk,
    jest,
    pulumi,
    fastify,
    rmwc,
    lexical,
    ts,
    graphql,
    eslint,
    prettier,
    vitest,
    storybook,
    emotion,
    fontawesome
];
