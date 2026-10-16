import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { VimMode } from '../core/models/game.models';

@Component({
  selector: 'app-mode-indicator',
  template: '<span class="mode" [class]="\'mode \'+mode()"><i></i>{{ mode().toUpperCase() }}</span>',
  styles: `
    .mode { display:inline-flex; align-items:center; gap:8px; padding:7px 10px; border-radius:7px; font-size:11px; font-weight:900; letter-spacing:.12em; color:#8fc3ff; background:rgba(91,167,255,.12); }
    i { width:7px; height:7px; border-radius:50%; background:currentColor; box-shadow:0 0 10px currentColor; }
    .insert { color:var(--accent-success); background:rgba(70,209,125,.12); }
    .visual { color:var(--accent-purple); background:rgba(169,133,255,.12); }
    .replace { color:var(--accent-warning); background:rgba(242,184,75,.12); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeIndicatorComponent { readonly mode = input<VimMode>('normal'); }
