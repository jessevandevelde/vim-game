import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'learn', loadComponent: () => import('./features/learning-path/learning-path.page').then(m => m.LearningPathPage) },
  { path: 'challenge/:id', loadComponent: () => import('./features/challenge/challenge.page').then(m => m.ChallengePage) },
  { path: 'practice', loadComponent: () => import('./features/practice/practice.page').then(m => m.PracticePage) },
  { path: 'speedrun', loadComponent: () => import('./features/speedrun/speedrun.page').then(m => m.SpeedrunPage) },
  { path: 'golf', loadComponent: () => import('./features/vim-golf/vim-golf.page').then(m => m.VimGolfPage) },
  { path: 'stats', loadComponent: () => import('./features/statistics/statistics.page').then(m => m.StatisticsPage) },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.page').then(m => m.SettingsPage) },
  { path: '**', redirectTo: '' },
];
