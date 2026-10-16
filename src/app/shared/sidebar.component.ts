import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GameStateService } from '../core/services/game-state.service';
import { IconComponent } from './icon.component';
import { ProgressBarComponent } from './progress-bar.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent, ProgressBarComponent],
  template: `
    <aside class="sidebar">
      <a class="brand" routerLink="/" aria-label="VimQuest home"><span class="logo">V</span><span class="brand-copy"><b>VimQuest</b><small>Master the keyboard</small></span></a>
      <nav aria-label="Main navigation">
        @for (item of nav; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.path === '/' }">
            <app-icon [name]="item.icon" [size]="19" /><span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <div class="level-card">
        <div class="level-top"><span>Level {{ state.level() }}</span><b>{{ state.progress().xp }} XP</b></div>
        <app-progress-bar [value]="state.xpIntoLevel() / state.xpForNextLevel() * 100" />
        <small>{{ state.xpForNextLevel() - state.xpIntoLevel() }} XP to next level</small>
      </div>
      <a class="settings" routerLink="/settings" routerLinkActive="active"><app-icon name="Settings" /><span>Settings</span></a>
    </aside>
  `,
  styles: `
    .sidebar { position:sticky; top:0; height:100vh; display:flex; flex-direction:column; padding:25px 17px; border-right:1px solid var(--border-soft); background:rgba(9,13,18,.88); backdrop-filter:blur(18px); z-index:10; }
    .brand { display:flex; align-items:center; gap:11px; margin:0 8px 35px; color:inherit; text-decoration:none; }
    .logo { width:36px; height:36px; display:grid; place-items:center; border-radius:10px; color:#07111d; background:linear-gradient(135deg,#73b8ff,#48d392); font-family:ui-monospace,monospace; font-weight:950; box-shadow:0 8px 25px rgba(91,167,255,.22); }
    .brand-copy { display:flex; flex-direction:column; } .brand-copy b { letter-spacing:-.02em; } .brand-copy small { color:var(--text-muted); font-size:10px; margin-top:2px; }
    nav { display:flex; flex-direction:column; gap:5px; }
    nav a, .settings { min-height:43px; display:flex; align-items:center; gap:12px; padding:0 12px; border-radius:9px; color:var(--text-secondary); text-decoration:none; font-size:13px; font-weight:720; transition:.15s ease; }
    nav a:hover, .settings:hover { color:var(--text-primary); background:rgba(255,255,255,.04); }
    nav a.active, .settings.active { color:#b7d9ff; background:rgba(var(--accent-primary-rgb),.12); box-shadow:inset 2px 0 var(--accent-primary); }
    .level-card { margin-top:auto; padding:14px; border:1px solid var(--border-soft); border-radius:12px; background:var(--bg-secondary); }
    .level-top { display:flex; justify-content:space-between; margin-bottom:11px; font-size:12px; font-weight:800; } .level-top b { color:var(--accent-primary); } .level-card small { display:block; margin-top:9px; color:var(--text-muted); font-size:10px; }
    .settings { margin-top:12px; }
    @media(max-width:900px) { .sidebar { padding:22px 11px; } .brand { margin-inline:auto; } .brand-copy, nav span, .settings span, .level-card { display:none; } nav a,.settings { justify-content:center; padding:0; } }
    @media(max-width:620px) { .sidebar { position:fixed; inset:auto 0 0; width:100%; height:70px; padding:9px 10px; flex-direction:row; align-items:center; border-right:0; border-top:1px solid var(--border-soft); } .brand,.level-card,.settings { display:none; } nav { width:100%; flex-direction:row; justify-content:space-around; } nav a { width:44px; } nav a:nth-child(n+7) { display:none; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly state = inject(GameStateService);
  readonly nav = [
    { label: 'Dashboard', path: '/', icon: 'House' }, { label: 'Learning Path', path: '/learn', icon: 'Map' },
    { label: 'Practice', path: '/practice', icon: 'Dumbbell' }, { label: 'Speedrun', path: '/speedrun', icon: 'Timer' },
    { label: 'Vim Golf', path: '/golf', icon: 'Trophy' }, { label: 'Statistics', path: '/stats', icon: 'ChartNoAxesColumnIncreasing' },
  ];
}
