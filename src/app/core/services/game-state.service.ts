import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { ALL_CHALLENGES, CHAPTERS, localDateKey } from '../../data/campaign.data';
import { GameSettings, PlayerProgress } from '../models/game.models';
import { StorageService } from './storage.service';

const PROGRESS_KEY = 'vimquest.progress.v1';
const SETTINGS_KEY = 'vimquest.settings.v1';

export const DEFAULT_PROGRESS: PlayerProgress = {
  schemaVersion: 1, xp: 0, completedChallenges: [], stars: {}, mastery: {}, achievements: [],
  personalBests: {}, totalPracticeSeconds: 0, dailyCompleted: [], recentActivity: [],
};

export const DEFAULT_SETTINGS: GameSettings = {
  theme: 'midnight', fontSize: 15, tabSize: 2, lineNumbers: true, cursorStyle: 'block',
  soundEffects: false, animations: true, commandHints: true, timer: true,
};

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly storage = inject(StorageService);
  readonly progress = signal(this.loadProgress());
  readonly settings = signal(this.loadSettings());
  readonly level = computed(() => this.levelForXp(this.progress().xp));
  readonly xpIntoLevel = computed(() => this.progress().xp - this.xpForLevel(this.level()));
  readonly xpForNextLevel = computed(() => this.xpForLevel(this.level() + 1) - this.xpForLevel(this.level()));
  readonly overallPercent = computed(() => Math.round(this.progress().completedChallenges.length / ALL_CHALLENGES.length * 100));
  readonly nextChallenge = computed(() => ALL_CHALLENGES.find(challenge => !this.progress().completedChallenges.includes(challenge.id)) ?? ALL_CHALLENGES[0]);
  readonly unlockedChapter = computed(() => {
    const completed = new Set(this.progress().completedChallenges);
    let unlocked = 1;
    CHAPTERS.forEach((chapter, index) => {
      if (chapter.challenges.every(challenge => completed.has(challenge.id))) unlocked = Math.min(CHAPTERS.length, index + 2);
    });
    return unlocked;
  });
  readonly streak = computed(() => {
    const days = new Set(this.progress().dailyCompleted);
    let streak = 0;
    const date = new Date();
    while (days.has(localDateKey(date))) { streak++; date.setDate(date.getDate() - 1); }
    return streak;
  });

  constructor() {
    effect(() => this.storage.write(PROGRESS_KEY, this.progress()));
    effect(() => {
      const settings = this.settings();
      this.storage.write(SETTINGS_KEY, settings);
      document.documentElement.dataset['theme'] = settings.theme;
      document.documentElement.classList.toggle('reduced-game-motion', !settings.animations);
    });
  }

  completeChallenge(id: string, xpReward: number, stars: number, commands: string[], mistakes: number, hints: number, elapsedSeconds: number): boolean {
    const wasCompleted = this.progress().completedChallenges.includes(id);
    this.progress.update(current => {
      const completedChallenges = wasCompleted ? current.completedChallenges : [...current.completedChallenges, id];
      const mastery = { ...current.mastery };
      for (const command of new Set(commands.filter(key => /^[a-zA-Z$^*.#]+$/.test(key)))) {
        const previous = mastery[command] ?? { attempts: 0, successes: 0, mistakes: 0, hints: 0, score: 0, lastPracticed: '' };
        const attempts = previous.attempts + 1;
        const successes = previous.successes + 1;
        const confidence = Math.min(1, attempts / 5);
        const quality = Math.max(0, 1 - (mistakes * .12) - (hints * .1));
        mastery[command] = { attempts, successes, mistakes: previous.mistakes + mistakes, hints: previous.hints + hints, score: Math.round(100 * confidence * quality), lastPracticed: new Date().toISOString() };
      }
      const achievements = new Set(current.achievements);
      achievements.add('First Steps');
      if (stars === 3) achievements.add('Perfect Run');
      if (completedChallenges.filter(challengeId => challengeId.startsWith('ch1')).length === 10) achievements.add('No More Arrows');
      return {
        ...current, xp: current.xp + (wasCompleted ? 0 : xpReward), completedChallenges,
        stars: { ...current.stars, [id]: Math.max(current.stars[id] ?? 0, stars) }, mastery,
        achievements: [...achievements], totalPracticeSeconds: current.totalPracticeSeconds + elapsedSeconds,
        recentActivity: [{ challengeId: id, completedAt: new Date().toISOString(), stars }, ...current.recentActivity].slice(0, 8),
      };
    });
    return !wasCompleted;
  }

  markDaily(dateKey: string): void {
    this.progress.update(current => current.dailyCompleted.includes(dateKey) ? current : { ...current, dailyCompleted: [...current.dailyCompleted, dateKey] });
  }

  saveBest(id: string, value: number): void {
    this.progress.update(current => ({ ...current, personalBests: { ...current.personalBests, [id]: Math.min(current.personalBests[id] ?? Number.MAX_SAFE_INTEGER, value) } }));
  }

  updateSettings(patch: Partial<GameSettings>): void { this.settings.update(current => ({ ...current, ...patch })); }
  resetProgress(): void { this.progress.set(structuredClone(DEFAULT_PROGRESS)); }
  chapterPercent(chapterId: string): number {
    const chapter = CHAPTERS.find(item => item.id === chapterId);
    if (!chapter) return 0;
    return Math.round(chapter.challenges.filter(challenge => this.progress().completedChallenges.includes(challenge.id)).length / chapter.challenges.length * 100);
  }
  isUnlocked(chapterOrder: number): boolean { return chapterOrder <= this.unlockedChapter(); }
  xpForLevel(level: number): number { return Math.round(100 * Math.pow(Math.max(0, level - 1), 1.55)); }
  levelForXp(xp: number): number { let level = 1; while (this.xpForLevel(level + 1) <= xp) level++; return level; }

  private loadProgress(): PlayerProgress {
    const data = this.storage.read<Partial<PlayerProgress>>(PROGRESS_KEY, DEFAULT_PROGRESS);
    return data.schemaVersion === 1 ? { ...DEFAULT_PROGRESS, ...data } as PlayerProgress : structuredClone(DEFAULT_PROGRESS);
  }
  private loadSettings(): GameSettings { return { ...DEFAULT_SETTINGS, ...this.storage.read<Partial<GameSettings>>(SETTINGS_KEY, {}) }; }
}
