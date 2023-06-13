import { Topic } from "@webiny/pubsub/types";
import { File } from "./file";

export interface OnFileBeforeCreateTopicParams<TFile extends File = File> {
    file: TFile;
    meta?: Record<string, any>;
}

export interface OnFileAfterCreateTopicParams<TFile extends File = File> {
    file: TFile;
    meta?: Record<string, any>;
}

export interface OnFileBeforeBatchCreateTopicParams<TFile extends File = File> {
    files: TFile[];
    meta?: Record<string, any>;
}

export interface OnFileAfterBatchCreateTopicParams<TFile extends File = File> {
    files: TFile[];
    meta?: Record<string, any>;
}

export interface OnFileBeforeUpdateTopicParams<TFile extends File = File> {
    original: TFile;
    file: TFile;
    input: Record<string, any>;
}

export interface OnFileAfterUpdateTopicParams<TFile extends File = File> {
    original: TFile;
    file: TFile;
    input: Record<string, any>;
}

export interface OnFileBeforeDeleteTopicParams<TFile extends File = File> {
    file: TFile;
}

export interface OnFileAfterDeleteTopicParams<TFile extends File = File> {
    file: TFile;
}

export interface FileLifecycleEvents {
    onFileBeforeCreate: Topic<OnFileBeforeCreateTopicParams>;
    onFileAfterCreate: Topic<OnFileAfterCreateTopicParams>;
    onFileBeforeBatchCreate: Topic<OnFileBeforeBatchCreateTopicParams>;
    onFileAfterBatchCreate: Topic<OnFileAfterBatchCreateTopicParams>;
    onFileBeforeUpdate: Topic<OnFileBeforeUpdateTopicParams>;
    onFileAfterUpdate: Topic<OnFileAfterUpdateTopicParams>;
    onFileBeforeDelete: Topic<OnFileBeforeDeleteTopicParams>;
    onFileAfterDelete: Topic<OnFileAfterDeleteTopicParams>;
}
