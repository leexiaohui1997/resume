import { defineAsyncComponent } from 'vue';

export enum LayoutType {
  None,
  Index,
  Default,
  Workspace,
}

export const layoutComponents: Record<LayoutType, ReturnType<typeof defineAsyncComponent> | null> =
  {
    [LayoutType.None]: null,
    [LayoutType.Index]: defineAsyncComponent(() => import('./index/index.vue')),
    [LayoutType.Default]: defineAsyncComponent(() => import('./default/index.vue')),
    [LayoutType.Workspace]: defineAsyncComponent(() => import('./workspace/index.vue')),
  };
