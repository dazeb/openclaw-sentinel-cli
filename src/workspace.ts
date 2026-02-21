import * as path from 'path';

export type WorkspaceResolutionOptions = {
  workspaceDir?: string;
};

export function resolveWorkspaceDir(options: WorkspaceResolutionOptions = {}): string {
  const explicitWorkspaceDir = options.workspaceDir?.trim();
  const envWorkspaceDir = process.env.OPENCLAW_WORKSPACE_DIR?.trim();

  return path.resolve(explicitWorkspaceDir || envWorkspaceDir || process.cwd());
}

export function resolveWorkspaceFilePath(
  fileName: string,
  options: WorkspaceResolutionOptions = {}
): string {
  return path.join(resolveWorkspaceDir(options), fileName);
}
