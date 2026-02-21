import * as path from 'path';
export function resolveWorkspaceDir(options = {}) {
    const explicitWorkspaceDir = options.workspaceDir?.trim();
    const envWorkspaceDir = process.env.OPENCLAW_WORKSPACE_DIR?.trim();
    return path.resolve(explicitWorkspaceDir || envWorkspaceDir || process.cwd());
}
export function resolveWorkspaceFilePath(fileName, options = {}) {
    return path.join(resolveWorkspaceDir(options), fileName);
}
//# sourceMappingURL=workspace.js.map