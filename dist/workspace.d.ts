export type WorkspaceResolutionOptions = {
    workspaceDir?: string;
};
export declare function resolveWorkspaceDir(options?: WorkspaceResolutionOptions): string;
export declare function resolveWorkspaceFilePath(fileName: string, options?: WorkspaceResolutionOptions): string;
