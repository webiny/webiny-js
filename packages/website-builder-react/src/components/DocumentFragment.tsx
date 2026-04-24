"use client";
import React from "react";

export type DocumentFragmentProps =
    | {
          name: string;
          children: React.ReactNode;
          component?: never;
          inputs?: never;
      }
    | {
          component: string;
          inputs?: Record<string, any>;
          name?: never;
          children?: never;
      };

export function DocumentFragment(props: DocumentFragmentProps) {
    if (props.children) {
        return <>{props.children}</>;
    }

    return null;
}
