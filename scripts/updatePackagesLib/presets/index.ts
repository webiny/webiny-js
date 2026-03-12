import { react } from "./react";
import { babel } from "./babel";
import { awsSdk } from "./awsSdk";
import { pino } from "./pino";
import { pulumi } from "./pulumi";
import { fastify } from "./fastify";
import { lexical } from "./lexical";
import { ts } from "./ts";
import { graphql } from "./graphql";
import { eslint } from "./eslint";
import { prettier } from "./prettier";
import { vitest } from "./vitest";
import { storybook } from "./storybook";
import { emotion } from "./emotion.js";

export const presets = [
    react,
    babel,
    awsSdk,
    pino,
    pulumi,
    fastify,
    lexical,
    ts,
    graphql,
    eslint,
    prettier,
    vitest,
    storybook,
    emotion
];
