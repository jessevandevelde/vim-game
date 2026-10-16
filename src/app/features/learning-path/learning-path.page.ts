import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHAPTERS } from '../../data/campaign.data';
import { GameStateService } from '../../core/services/game-state.service';
import { IconComponent } from '../../shared/icon.component';
import { ProgressBarComponent } from '../../shared/progress-bar.component';

@Component({
  imports: [RouterLink, IconComponent, ProgressBarComponent],
  template: `
    <div class="page"><header class="page-header"><div><p class="eyebrow">Campaign</p><h1>Your path to fluency</h1><p class="subtitle">Nine chapters move from modal basics to compound refactors. Finish each chapter to unlock the next.</p></div><span class="pill">{{ state.progress().completedChallenges.length }} / 90 lessons</span></header>
      <div class="path">
        @for (chapter of chapters; track chapter.id; let index = $index) {
          <article class="chapter card" [class.locked]="!state.isUnlocked(chapter.order)" [class.complete]="state.chapterPercent(chapter.id) === 100">
            <div class="rail"><span class="node" [style.--chapter-color]="chapter.color"><app-icon [name]="state.isUnlocked(chapter.order) ? chapter.icon : 'Lock'" [size]="23" /></span>@if(index < chapters.length - 1){<i></i>}</div>
            <div class="body"><div class="meta"><span>Chapter {{ chapter.order }}</span><span>{{ chapter.difficulty }}</span></div><h2>{{ chapter.title }}</h2><p>{{ chapter.description }}</p><div class="progress-row"><app-progress-bar [value]="state.chapterPercent(chapter.id)" /><b>{{ state.chapterPercent(chapter.id) }}%</b></div>
              <div class="lessons">
                @for (challenge of chapter.challenges; track challenge.id) {
                  <a [routerLink]="state.isUnlocked(chapter.order) ? ['/challenge', challenge.id] : null" [class.done]="state.progress().completedChallenges.includes(challenge.id)"><span>{{ challenge.order }}</span><em>{{ challenge.title }}</em>@if(state.progress().completedChallenges.includes(challenge.id)){<app-icon name="Check" [size]="15" />}</a>
                }
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: `
    .path{display:grid;gap:16px}.chapter{display:grid;grid-template-columns:74px 1fr;padding:0;overflow:hidden;box-shadow:none}.chapter.locked{opacity:.48}.rail{display:flex;align-items:center;flex-direction:column;background:rgba(255,255,255,.018)}.node{width:50px;height:50px;display:grid;place-items:center;margin-top:25px;border:1px solid color-mix(in srgb,var(--chapter-color) 35%,transparent);border-radius:15px;color:var(--chapter-color);background:color-mix(in srgb,var(--chapter-color) 11%,var(--bg-secondary))}.rail i{width:1px;flex:1;margin-top:10px;background:linear-gradient(var(--border-primary),transparent)}.body{padding:24px 26px}.meta{display:flex;justify-content:space-between;color:var(--text-muted);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.body h2{margin:7px 0;font-size:21px}.body>p{color:var(--text-secondary);font-size:13px}.progress-row{display:grid;grid-template-columns:1fr 38px;gap:12px;align-items:center}.progress-row b{font-size:11px;color:var(--text-muted)}.lessons{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:18px}.lessons a{display:flex;align-items:center;gap:9px;padding:8px;border-radius:7px;color:var(--text-secondary);text-decoration:none;font-size:12px}.lessons a:hover{color:var(--text-primary);background:rgba(255,255,255,.035)}.lessons a>span{width:23px;height:23px;display:grid;place-items:center;border:1px solid var(--border-primary);border-radius:50%;font-size:10px}.lessons em{flex:1;font-style:normal}.lessons .done{color:#8cdaa9}.complete{border-color:rgba(70,209,125,.28)}@media(max-width:700px){.chapter{grid-template-columns:54px 1fr}.node{width:38px;height:38px}.body{padding:20px 16px}.lessons{grid-template-columns:1fr}}
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPathPage { readonly state = inject(GameStateService); readonly chapters = CHAPTERS; }
