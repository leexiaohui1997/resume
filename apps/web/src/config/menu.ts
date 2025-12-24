export type MenuItemRaw = {
  id: string;
  title: string;
  path?: string;
  children?: MenuItemRaw[];
};

export const MENU: MenuItemRaw[] = [
  {
    id: 'resume',
    title: '简历',
    path: '/workspace/resume',
  },
];
