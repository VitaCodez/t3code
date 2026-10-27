import { useCallback } from "react";
import { scopeProjectRef } from "@t3tools/client-runtime/environment";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";

import { CONVERSATIONS_PROJECT_TITLE, isConversationsProject } from "../conversations";
import { resolveDefaultProviderModelSelection } from "../providerInstances";
import { newProjectId } from "../lib/utils";
import { useProjects } from "../state/entities";
import { useEnvironmentProviders, useEnvironments, usePrimaryEnvironmentId } from "../state/environments";
import { EMPTY_SERVER_PROVIDERS } from "../state/server";
import { projectEnvironment } from "../state/projects";
import { useAtomCommand } from "../state/use-atom-command";
import { stackedThreadToast, toastManager } from "../components/ui/toast";
import { useNewThreadHandler } from "./useHandleNewThread";

export function useHandleNewConversation() {
  const projects = useProjects();
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const { environments } = useEnvironments();
  const providersByEnvironment = useEnvironmentProviders();
  const handleNewThread = useNewThreadHandler();
  const createProject = useAtomCommand(projectEnvironment.create, { reportFailure: false });

  return useCallback(async () => {
    if (!primaryEnvironmentId) return;

    const existing = projects.find(
      (p) => isConversationsProject(p) && p.environmentId === primaryEnvironmentId,
    );

    if (existing) {
      await handleNewThread(scopeProjectRef(existing.environmentId, existing.id));
      return;
    }

    const providers = providersByEnvironment.get(primaryEnvironmentId) ?? EMPTY_SERVER_PROVIDERS;
    const cwd = "~/.t3/conversations";

    const projectId = newProjectId();
    const createResult = await createProject({
      environmentId: primaryEnvironmentId,
      input: {
        projectId,
        title: CONVERSATIONS_PROJECT_TITLE,
        workspaceRoot: cwd,
        createWorkspaceRootIfMissing: true,
        defaultModelSelection: resolveDefaultProviderModelSelection(providers, null),
      },
    });

    if (createResult._tag === "Failure") {
      if (!isAtomCommandInterrupted(createResult)) {
        const error = squashAtomCommandFailure(createResult);
        toastManager.add(
          stackedThreadToast({
            type: "error",
            title: "Failed to create conversation",
            description: error instanceof Error ? error.message : "An error occurred.",
          }),
        );
      }
      return;
    }

    await handleNewThread(scopeProjectRef(primaryEnvironmentId, projectId));
  }, [createProject, handleNewThread, primaryEnvironmentId, projects, providersByEnvironment]);
}
