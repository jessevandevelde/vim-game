import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChallengeSnapshot, VimMode } from '../../core/models/game.models';
import { ChallengeEngineService } from '../../core/services/challenge-engine.service';
import { GameStateService } from '../../core/services/game-state.service';
import { ALL_CHALLENGES, challengeById, dailyChallenge, localDateKey } from '../../data/campaign.data';
import { IconComponent } from '../../shared/icon.component';
import { ModeIndicatorComponent } from '../../shared/mode-indicator.component';
import { ProgressBarComponent } from '../../shared/progress-bar.component';
import { VimEditorComponent } from './vim-editor.component';

@Component({
  imports: [RouterLink, IconComponent, ModeIndicatorComponent, ProgressBarComponent, VimEditorComponent],
  template: `
    <div class="page challenge-page">
      <header class="challenge-header">
        <div class="title-row"><a class="back" routerLink="/learn" aria-label="Back to learning path"><app-icon name="ArrowLeft" /></a><div><p class="eyebrow">{{ challenge().chapterId.toUpperCase() }} · LESSON {{ challenge().order }}</p><h1>{{ challenge().title }}</h1></div></div>
        <div class="run-stats">@if(state.settings().timer){<span><app-icon name="Clock3" [size]="15" /> {{ formattedTime() }}</span>}<span><app-icon name="Zap" [size]="15" /> {{ challenge().xpReward }} XP</span><span>{{ keystrokes().length }} keys</span></div>
      </header>
      <div class="level-progress"><app-progress-bar [value]="challenge().order * 10" /><span>{{ challenge().order }} / 10</span></div>
      <section class="workspace card">
        <div class="editor-top"><div class="file-tab"><app-icon name="Braces" [size]="15" /> challenge.ts <i></i></div><div class="editor-actions"><button (click)="reset()"><app-icon name="RotateCcw" [size]="15" /> Reset</button><app-mode-indicator [mode]="mode()" /></div></div>
        <div class="editor-grid">
          <app-vim-editor #vimEditor [challenge]="challenge()" [settings]="state.settings()" (snapshotChange)="onSnapshot($event)" (vimKey)="onVimKey($event)" (physicalKey)="onPhysicalKey($event)" (modeChange)="mode.set($event)" (blockedInput)="onBlocked($event)" />
          <aside class="instructions">
            <span class="lesson-type"><app-icon name="Target" [size]="15" /> Objective</span><h2>{{ challenge().objective }}</h2><p>{{ challenge().concept }}</p>
            <div class="command-box"><small>AVAILABLE COMMANDS</small><div>@for(command of challenge().allowedCommands; track command){<kbd>{{ command }}</kbd>}</div></div>
            @if(state.settings().commandHints){<div class="hint-area"><button (click)="revealHint()"><app-icon name="Lightbulb" [size]="16" /> {{ hintIndex() < 0 ? 'Reveal a hint' : 'Next hint' }}</button>@if(hintIndex() >= 0){<p>{{ challenge().hints[hintIndex()] }}</p>}</div>}
            <div class="tip"><app-icon name="Info" [size]="15" /><span>Click the editor, then keep your hands on the keyboard. <b>Esc</b> always returns to Normal mode.</span></div>
          </aside>
        </div>
        <div class="console">
          <div class="keys"><span class="console-label">KEYSTROKES</span><div class="key-row">@if(keystrokes().length === 0){<em>Waiting for input…</em>}@for(key of recentKeys(); track $index){<kbd>{{ key }}</kbd>}</div></div>
          <div class="command-readout"><span class="console-label">COMMAND READOUT</span><strong>{{ commandTitle() }}</strong><small>{{ commandExplanation() }}</small></div>
          <div class="feedback" [class.warn]="feedback().length"><span class="console-label">COACH</span><p>{{ feedback()[0] || 'Focus the editor to begin. VimQuest validates the result, not one hard-coded sequence.' }}</p></div>
        </div>
      </section>
      @if(completed()){
        <div class="completion-backdrop" role="dialog" aria-modal="true" aria-labelledby="complete-title">
          <section class="completion card"><div class="success-icon"><app-icon name="Check" [size]="34" /></div><p class="eyebrow">Challenge complete</p><h2 id="complete-title">Command landed.</h2><div class="stars" [attr.aria-label]="stars() + ' stars'">@for(star of [1,2,3];track star){<app-icon name="Star" [size]="26" [class.dim]="star > stars()" />}</div><p>{{ completionMessage() }}</p>
            <div class="score-grid"><div><b>{{ keystrokes().length }}</b><span>keystrokes</span></div><div><b>{{ formattedTime() }}</b><span>time</span></div><div><b>{{ efficiency() }}%</b><span>efficiency</span></div></div>
            <div class="reference"><small>REFERENCE</small><kbd>{{ challenge().referenceSolution }}</kbd><span>This is a verified efficient solution, not a claim of global optimality.</span></div>
            <div class="complete-actions"><button class="btn ghost" (click)="retry()">Try again</button><button class="btn primary" (click)="nextChallenge()">Next lesson <app-icon name="ArrowRight" [size]="16" /></button></div>
          </section>
        </div>
      }
    </div>
  `,
  styleUrl: './challenge.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengePage {
  readonly state = inject(GameStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly engine = inject(ChallengeEngineService);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  readonly challenge = computed(() => challengeById(this.params().get('id')));
  readonly editor = viewChild<VimEditorComponent>('vimEditor');
  readonly mode = signal<VimMode>('normal');
  readonly keystrokes = signal<string[]>([]);
  readonly commands = signal<string[]>([]);
  readonly feedback = signal<string[]>([]);
  readonly blocked = signal(false);
  readonly hintIndex = signal(-1);
  readonly mistakes = signal(0);
  readonly elapsed = signal(0);
  readonly completed = signal(false);
  readonly stars = signal(1);
  readonly efficiency = signal(100);
  readonly awarded = signal(false);
  readonly recentKeys = computed(() => this.keystrokes().slice(-12));
  readonly formattedTime = computed(() => `${String(Math.floor(this.elapsed() / 60)).padStart(2, '0')}:${String(this.elapsed() % 60).padStart(2, '0')}`);
  readonly commandTitle = computed(() => this.describeKeys(this.keystrokes().slice(-5)).title);
  readonly commandExplanation = computed(() => this.describeKeys(this.keystrokes().slice(-5)).body);
  private snapshot?: Omit<ChallengeSnapshot, 'commands' | 'blockedInput'>;
  private startedAt = Date.now();
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
    this.startTimer();
    effect(() => { this.challenge(); this.resetMetrics(); });
  }

  onSnapshot(snapshot: Omit<ChallengeSnapshot, 'commands' | 'blockedInput'>): void { this.snapshot = snapshot; this.validate(); }
  onVimKey(key: string): void { this.commands.update(keys => [...keys, key]); }
  onPhysicalKey(key: string): void { this.keystrokes.update(keys => [...keys, key]); queueMicrotask(() => this.validate()); }
  onBlocked(type: 'mouse' | 'arrow' | 'paste'): void { this.blocked.set(true); this.mistakes.update(value => value + 1); this.feedback.set([type === 'paste' ? 'Paste is disabled here so scoring reflects Vim input.' : 'That input works in an editor, but it does not count for this guided motion. Use Vim keys.']); }
  revealHint(): void { this.hintIndex.update(value => Math.min(value + 1, this.challenge().hints.length - 1)); }
  reset(): void { this.editor()?.reset(); this.resetMetrics(); }
  retry(): void { this.completed.set(false); this.reset(); }
  nextChallenge(): void { const index = ALL_CHALLENGES.findIndex(item => item.id === this.challenge().id); void this.router.navigate(['/challenge', ALL_CHALLENGES[(index + 1) % ALL_CHALLENGES.length].id]); }
  completionMessage(): string { return this.awarded() ? `You earned ${this.challenge().xpReward} XP. The lesson has been saved to your path.` : 'Replay complete. Your best stars are preserved; campaign XP is awarded once.'; }

  private validate(): void {
    if (!this.snapshot || this.completed() || this.keystrokes().length === 0) return;
    const result = this.engine.validate(this.challenge(), { ...this.snapshot, commands: this.commands(), blockedInput: this.blocked() });
    this.feedback.set(result.messages);
    if (!result.complete) return;
    const efficiency = this.engine.efficiency(this.challenge().referenceKeystrokes, this.keystrokes().length);
    const stars = this.engine.stars(efficiency, this.mistakes(), Math.max(0, this.hintIndex() + 1));
    this.efficiency.set(efficiency); this.stars.set(stars); this.completed.set(true); clearInterval(this.timer);
    const awarded = this.state.completeChallenge(this.challenge().id, this.challenge().xpReward, stars, this.commands(), this.mistakes(), Math.max(0, this.hintIndex() + 1), this.elapsed());
    this.awarded.set(awarded);
    if (this.state.settings().soundEffects) this.playSuccessTone();
    if (this.challenge().id === dailyChallenge().id) this.state.markDaily(localDateKey());
  }
  private resetMetrics(): void { this.keystrokes.set([]); this.commands.set([]); this.feedback.set([]); this.blocked.set(false); this.hintIndex.set(-1); this.mistakes.set(0); this.elapsed.set(0); this.completed.set(false); this.mode.set('normal'); this.snapshot = undefined; this.startedAt = Date.now(); this.startTimer(); }
  private startTimer(): void { clearInterval(this.timer); this.timer = setInterval(() => { if (!this.completed()) this.elapsed.set(Math.floor((Date.now() - this.startedAt) / 1000)); }, 1000); }
  private describeKeys(keys: string[]): { title: string; body: string } {
    const joined = keys.join('');
    const patterns: Array<[RegExp, string, string]> = [
      [/ciw$/, 'ciw — Change Inner Word', 'c = change · i = inside · w = word'], [/diw$/, 'diw — Delete Inner Word', 'd = delete · i = inside · w = word'], [/\d+dw$/, `${joined} — Counted Delete`, 'count × delete operator × word motion'], [/dd$/, 'dd — Delete Line', 'Repeating the delete operator targets the whole line.'], [/dw$/, 'dw — Delete Word', 'd = delete operator · w = word motion'], [/cw$/, 'cw — Change Word', 'c = change operator · w = word motion'], [/^\d+w$/, `${joined} — Counted Motion`, 'The count repeats the word motion.'], [/Esc$/, 'Escape — Normal Mode', 'Finish insertion and return to Vim command mode.'], [/i$/, 'i — Insert Before', 'Enter Insert mode before the cursor.'], [/a$/, 'a — Append After', 'Enter Insert mode after the cursor.'], [/v$/i, 'v — Visual Mode', 'Start a character-wise selection.'],
    ];
    const match = patterns.find(([pattern]) => pattern.test(joined));
    return match ? { title: match[1], body: match[2] } : joined ? { title: joined, body: 'Vim is reading the sequence. Compound commands complete when their motion or text object arrives.' } : { title: 'No command yet', body: 'Try the suggested motion in the editor.' };
  }
  private playSuccessTone(): void {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
    gain.connect(context.destination);
    [523.25, 659.25].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.08); oscillator.stop(context.currentTime + 0.34);
    });
    setTimeout(() => void context.close(), 450);
  }
}
