import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHAPTERS, dailyChallenge, localDateKey } from '../../data/campaign.data';
import { GameStateService } from '../../core/services/game-state.service';
import { IconComponent } from '../../shared/icon.component';
import { ProgressBarComponent } from '../../shared/progress-bar.component';

@Component({
  imports: [RouterLink, IconComponent, ProgressBarComponent],
  template: `
    <div class="page">
      <header class="page-header"><div><p class="eyebrow">Your training ground</p><h1>Good to see you, Vim pilot.</h1><p class="subtitle">Build editing instincts one deliberate command at a time.</p></div><span class="pill"><app-icon name="Flame" [size]="15" /> {{ state.streak() }} day streak</span></header>
      <section class="hero card">
        <div class="hero-copy"><span class="chapter-tag">CHAPTER {{ next.chapterId.slice(2) }} · LESSON {{ next.order }}</span><h2>{{ next.title }}</h2><p>{{ next.concept }}</p><div class="hero-actions"><a class="btn primary" [routerLink]="['/challenge', next.id]">Continue learning <app-icon name="ArrowRight" [size]="17" /></a><span>{{ state.overallPercent() }}% campaign complete</span></div></div>
        <div class="level-orbit"><div><small>LEVEL</small><strong>{{ state.level() }}</strong><span>{{ state.progress().xp }} XP</span></div><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="53"/><circle class="fill" cx="60" cy="60" r="53" [style.stroke-dashoffset]="333 - 333 * state.xpIntoLevel() / state.xpForNextLevel()"/></svg></div>
      </section>
      <div class="stat-grid">
        <article class="card stat"><app-icon name="CircleCheckBig" /><div><b class="stat-number">{{ state.progress().completedChallenges.length }}</b><span>Challenges cleared</span></div></article>
        <article class="card stat"><app-icon name="Star" /><div><b class="stat-number">{{ totalStars() }}</b><span>Stars earned</span></div></article>
        <article class="card stat"><app-icon name="Clock3" /><div><b class="stat-number">{{ practiceMinutes() }}m</b><span>Practice time</span></div></article>
        <article class="card stat"><app-icon name="Zap" /><div><b class="stat-number">{{ masteryAverage() }}%</b><span>Average mastery</span></div></article>
      </div>
      <div class="content-grid">
        <section>
          <div class="section-title"><h2>Learning path</h2><a routerLink="/learn">View all</a></div>
          <div class="chapters">
            @for (chapter of chapters.slice(0, 4); track chapter.id) {
              <a class="chapter card" [routerLink]="state.isUnlocked(chapter.order) ? ['/challenge', chapter.challenges[0].id] : null" [class.locked]="!state.isUnlocked(chapter.order)">
                <span class="chapter-icon" [style.--chapter-color]="chapter.color"><app-icon [name]="chapter.icon" /></span>
                <div class="chapter-body"><small>Chapter {{ chapter.order }}</small><h3>{{ chapter.shortTitle }}</h3><app-progress-bar [value]="state.chapterPercent(chapter.id)" /></div>
                <b>{{ state.chapterPercent(chapter.id) }}%</b>
              </a>
            }
          </div>
        </section>
        <aside>
          <div class="section-title"><h2>Daily quest</h2><span class="pill">+{{ daily.xpReward }} XP</span></div>
          <article class="daily card"><div class="daily-glow"></div><span class="daily-icon"><app-icon name="CalendarCheck" [size]="25" /></span><p class="eyebrow">{{ today }}</p><h3>{{ daily.title }}</h3><p>{{ daily.objective }}</p><a class="btn ghost" [routerLink]="['/challenge', daily.id]">Play daily challenge</a></article>
        </aside>
      </div>
    </div>
  `,
  styleUrl: './dashboard.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  readonly state = inject(GameStateService);
  readonly chapters = CHAPTERS;
  readonly daily = dailyChallenge();
  readonly today = localDateKey();
  get next() { return this.state.nextChallenge(); }
  totalStars(): number { return Object.values(this.state.progress().stars).reduce((sum, value) => sum + value, 0); }
  practiceMinutes(): number { return Math.round(this.state.progress().totalPracticeSeconds / 60); }
  masteryAverage(): number { const values = Object.values(this.state.progress().mastery); return values.length ? Math.round(values.reduce((sum, value) => sum + value.score, 0) / values.length) : 0; }
}
