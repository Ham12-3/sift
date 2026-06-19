'use client';

import { createContext, useContext } from 'react';
import type { Project } from './types';

interface ProjectCtx {
  project: Project;
  reload: () => void;
}

const Ctx = createContext<ProjectCtx | undefined>(undefined);

export function ProjectProvider({ value, children }: { value: ProjectCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProject(): ProjectCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProject must be used within a project route');
  return ctx;
}
