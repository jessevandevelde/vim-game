import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';

type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover';
type VimKey = 'h' | 'j' | 'k' | 'l';

interface Point {
  x: number;
  y: number;
}

interface Direction extends Point {
  key: VimKey;
  label: string;
}

const BOARD_WIDTH = 20;
const BOARD_HEIGHT = 16;
const BEST_SCORE_KEY = 'vimquest-snake-best';
const DIRECTIONS: Record<VimKey, Direction> = {
  h: { x: -1, y: 0, key: 'h', label: 'left' },
  j: { x: 0, y: 1, key: 'j', label: 'down' },
  k: { x: 0, y: -1, key: 'k', label: 'up' },
  l: { x: 1, y: 0, key: 'l', label: 'right' },
};

@Component({
  imports: [IconComponent, RouterLink],
  template: `
    <div #gameRoot class="page snake-page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Vim arcade</p>
          <h1>Vim Snake</h1>
          <p class="subtitle">
            Eat the targets, grow your command chain, and keep your hands on the home row.
          </p>
        </div>
        <div class="game-actions">
          <div class="high-score">
            <app-icon name="Crown" [size]="18" /><span>Best</span><strong>{{ bestScore() }}</strong>
          </div>
          <button
            class="screen-button"
            type="button"
            (click)="toggleFullscreen()"
            [attr.aria-label]="isFullscreen() ? 'Exit fullscreen' : 'Enter fullscreen'"
          >
            <app-icon [name]="isFullscreen() ? 'Minimize2' : 'Maximize2'" [size]="18" />
            <span>{{ isFullscreen() ? 'Windowed' : 'Fullscreen' }}</span>
          </button>
          <a class="screen-button close-button" routerLink="/" aria-label="Exit Vim Snake"
            ><app-icon name="X" [size]="20"
          /></a>
        </div>
      </header>

      <section class="game-layout">
        <div class="arena-shell card">
          <div class="arena-topbar">
            <div class="status-dot" [class.live]="status() === 'playing'"></div>
            <span>{{ statusLabel() }}</span>
            <span class="mobile-score">Score {{ score() }}</span>
            <span class="speed">{{ speedLabel() }}</span>
          </div>

          <div
            class="board"
            role="application"
            aria-label="Vim Snake game board"
            [attr.aria-describedby]="status() === 'gameover' ? 'game-message' : null"
          >
            @for (
              segment of snake();
              track segment.x + '-' + segment.y;
              let first = $first;
              let index = $index
            ) {
              <div
                class="snake-segment"
                [class.head]="first"
                [style.left.%]="segment.x * 5"
                [style.top.%]="segment.y * 6.25"
                [style.--segment-fade]="segmentFade(index)"
              >
                @if (first) {
                  <span class="eye one"></span><span class="eye two"></span>
                }
              </div>
            }
            <div class="food" [style.left.%]="food().x * 5" [style.top.%]="food().y * 6.25">
              <span></span>
            </div>

            @if (status() !== 'playing' && status() !== 'paused') {
              <div class="board-overlay">
                <div class="overlay-icon">
                  <app-icon
                    [name]="status() === 'gameover' ? 'RotateCcw' : 'Gamepad2'"
                    [size]="28"
                  />
                </div>
                <h2 id="game-message">
                  {{ status() === 'gameover' ? 'Command chain broken' : 'Ready for motion?' }}
                </h2>
                <p>
                  {{
                    status() === 'gameover'
                      ? 'Score ' + score() + ' · press R to reset'
                      : 'Press any movement key to begin'
                  }}
                </p>
                <button class="btn primary" type="button" (click)="startOrRestart()">
                  {{ status() === 'gameover' ? 'Run it again' : 'Start game' }}
                </button>
              </div>
            }
            @if (status() === 'paused') {
              <div class="board-overlay compact">
                <app-icon name="Pause" [size]="26" />
                <h2>Paused</h2>
                <p>Press space to continue</p>
              </div>
            }
          </div>

          <div class="touch-controls" aria-label="Vim movement controls">
            <button type="button" aria-label="Move up with k" (click)="move('k')">
              <kbd>k</kbd><span>up</span>
            </button>
            <div>
              <button type="button" aria-label="Move left with h" (click)="move('h')">
                <kbd>h</kbd><span>left</span>
              </button>
              <button type="button" aria-label="Move down with j" (click)="move('j')">
                <kbd>j</kbd><span>down</span>
              </button>
              <button type="button" aria-label="Move right with l" (click)="move('l')">
                <kbd>l</kbd><span>right</span>
              </button>
            </div>
          </div>
        </div>

        <aside class="game-panel">
          <div class="score-card card">
            <span>Current score</span>
            <strong>{{ score() }}</strong>
            <small>{{ snake().length }} segment{{ snake().length === 1 ? '' : 's' }}</small>
          </div>

          <div class="command-card card">
            <p class="panel-label">Movement buffer</p>
            <div class="command-display">
              <span>:</span><strong>{{ lastKey() }}</strong
              ><i class="cursor"></i>
            </div>
            <p>
              Next motion: <b>{{ queuedDirection().label }}</b>
            </p>
          </div>

          <div class="keys-card card">
            <p class="panel-label">Vim controls</p>
            <div class="key-grid">
              @for (control of controls; track control.key) {
                <button
                  type="button"
                  [class.active]="queuedDirection().key === control.key"
                  (click)="move(control.key)"
                >
                  <kbd>{{ control.key }}</kbd
                  ><span>{{ control.label }}</span>
                </button>
              }
            </div>
            <div class="utility-key"><kbd>space</kbd><span>pause / resume</span></div>
            <div class="utility-key"><kbd>r</kbd><span>restart</span></div>
          </div>

          <div class="tip-card">
            <app-icon name="Lightbulb" [size]="18" />
            <p>
              <b>Vim tip</b> — <code>h j k l</code> replace the arrow keys, so your fingers never
              leave the home row.
            </p>
          </div>
        </aside>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .snake-page {
      position: fixed;
      inset: 0;
      z-index: 100;
      width: 100vw;
      max-width: none;
      height: 100dvh;
      display: flex;
      flex-direction: column;
      padding: clamp(14px, 2vw, 28px);
      overflow: hidden;
      background: radial-gradient(circle at 55% -20%, #172337 0, var(--bg-primary) 38%);
      animation: none;
    }
    .page-header {
      flex: 0 0 auto;
      align-items: center;
      margin-bottom: clamp(10px, 1.7vh, 20px);
    }
    .page-header h1 {
      font-size: clamp(26px, 3.2vw, 40px);
    }
    .game-actions {
      display: flex;
      align-items: stretch;
      gap: 8px;
    }
    .high-score {
      min-width: 122px;
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 2px 8px;
      padding: 12px 15px;
      border: 1px solid rgba(242, 184, 75, 0.22);
      border-radius: 12px;
      color: var(--accent-warning);
      background: rgba(242, 184, 75, 0.065);
    }
    .high-score span {
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .high-score strong {
      grid-column: 2;
      font-size: 20px;
      line-height: 1;
      color: var(--text-primary);
    }
    .screen-button {
      min-width: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 13px;
      border: 1px solid var(--border-primary);
      border-radius: 12px;
      color: var(--text-secondary);
      background: rgba(15, 20, 27, 0.9);
      font-size: 11px;
      font-weight: 750;
      cursor: pointer;
      text-decoration: none;
    }
    .screen-button:hover {
      color: var(--text-primary);
      border-color: #445268;
    }
    .close-button {
      padding: 0;
    }
    .game-layout {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) clamp(250px, 21vw, 300px);
      gap: clamp(12px, 1.5vw, 20px);
      align-items: stretch;
    }
    .arena-shell {
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 14px;
      overflow: hidden;
      background: linear-gradient(145deg, rgba(91, 167, 255, 0.04), transparent 45%), #0c1118;
    }
    .arena-topbar {
      height: 36px;
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 0 4px 12px;
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--text-muted);
      box-shadow: 0 0 0 4px rgba(104, 116, 131, 0.09);
    }
    .status-dot.live {
      background: var(--accent-success);
      box-shadow:
        0 0 0 4px rgba(70, 209, 125, 0.09),
        0 0 14px rgba(70, 209, 125, 0.5);
    }
    .mobile-score {
      margin-left: auto;
      color: var(--accent-success);
    }
    .speed {
      margin-left: 12px;
      color: var(--accent-primary);
    }
    .board {
      position: relative;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      border: 1px solid rgba(91, 167, 255, 0.16);
      border-radius: 12px;
      background-color: #090e14;
      background-image:
        linear-gradient(rgba(91, 167, 255, 0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(91, 167, 255, 0.045) 1px, transparent 1px),
        radial-gradient(circle at 50% 40%, rgba(37, 92, 123, 0.11), transparent 60%);
      background-size:
        5% 6.25%,
        5% 6.25%,
        100% 100%;
      box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.52);
    }
    .snake-segment,
    .food {
      position: absolute;
      width: 5%;
      height: 6.25%;
      padding: 3px;
      transition:
        left 80ms linear,
        top 80ms linear;
    }
    .snake-segment::before {
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 28%;
      background: color-mix(in srgb, var(--accent-success) calc(var(--segment-fade) * 1%), #1d7f53);
      box-shadow: 0 0 12px rgba(70, 209, 125, 0.14);
    }
    .snake-segment.head {
      z-index: 2;
    }
    .snake-segment.head::before {
      border-radius: 34%;
      background: #62e99a;
      box-shadow: 0 0 18px rgba(70, 209, 125, 0.4);
    }
    .eye {
      position: absolute;
      z-index: 3;
      top: 38%;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #07110b;
    }
    .eye.one {
      left: 39%;
    }
    .eye.two {
      right: 22%;
    }
    .food {
      display: grid;
      place-items: center;
      animation: food-pulse 1.05s ease-in-out infinite;
    }
    .food span {
      width: 56%;
      height: 56%;
      border-radius: 50%;
      background: #ff7186;
      box-shadow:
        0 0 0 4px rgba(255, 113, 134, 0.09),
        0 0 20px rgba(255, 113, 134, 0.65);
    }
    .board-overlay {
      position: absolute;
      inset: 0;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 22px;
      text-align: center;
      background: rgba(5, 9, 13, 0.7);
      backdrop-filter: blur(5px);
    }
    .board-overlay .overlay-icon {
      width: 58px;
      height: 58px;
      display: grid;
      place-items: center;
      margin-bottom: 14px;
      border: 1px solid rgba(91, 167, 255, 0.26);
      border-radius: 17px;
      color: var(--accent-primary);
      background: rgba(91, 167, 255, 0.09);
    }
    .board-overlay h2 {
      margin: 0 0 7px;
      font-size: clamp(20px, 3vw, 29px);
    }
    .board-overlay p {
      margin: 0 0 18px;
      color: var(--text-secondary);
      font-size: 13px;
    }
    .board-overlay.compact {
      background: rgba(5, 9, 13, 0.62);
    }
    .board-overlay.compact h2 {
      margin-top: 10px;
    }
    .touch-controls {
      display: none;
      margin-top: 14px;
      text-align: center;
    }
    .touch-controls button,
    .key-grid button {
      border: 1px solid var(--border-primary);
      border-radius: 9px;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.025);
      cursor: pointer;
    }
    .touch-controls button {
      width: 68px;
      height: 48px;
      margin: 3px;
    }
    .touch-controls button span {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
    }
    kbd {
      display: inline-grid;
      place-items: center;
      min-width: 25px;
      height: 25px;
      padding: 0 7px;
      border: 1px solid #425064;
      border-bottom-width: 2px;
      border-radius: 6px;
      color: var(--text-primary);
      background: #202936;
      font:
        800 12px ui-monospace,
        monospace;
      box-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);
    }
    .game-panel {
      min-height: 0;
      display: grid;
      grid-template-rows: auto auto auto 1fr;
      gap: 13px;
      overflow: auto;
      scrollbar-width: thin;
    }
    .score-card,
    .command-card,
    .keys-card {
      padding: 18px;
      box-shadow: none;
    }
    .score-card {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: end;
      background:
        linear-gradient(135deg, rgba(70, 209, 125, 0.08), transparent), var(--bg-secondary);
    }
    .score-card span {
      align-self: start;
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 750;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .score-card strong {
      grid-row: 1/3;
      grid-column: 2;
      color: var(--accent-success);
      font-size: 42px;
      letter-spacing: -0.06em;
      line-height: 0.9;
    }
    .score-card small {
      margin-top: 8px;
      color: var(--text-muted);
    }
    .panel-label {
      margin-bottom: 13px;
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .command-display {
      display: flex;
      align-items: center;
      gap: 5px;
      height: 44px;
      padding: 0 12px;
      border: 1px solid var(--border-primary);
      border-radius: 8px;
      color: var(--text-muted);
      background: #090d12;
      font:
        700 19px ui-monospace,
        monospace;
    }
    .command-display strong {
      color: var(--accent-success);
    }
    .cursor {
      width: 7px;
      height: 20px;
      background: var(--accent-success);
      animation: blink 1s steps(1) infinite;
    }
    .command-card > p:last-child {
      margin: 11px 0 0;
      color: var(--text-secondary);
      font-size: 11px;
    }
    .command-card b {
      color: var(--text-primary);
    }
    .key-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .key-grid button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px 3px;
      font-size: 8px;
      text-transform: uppercase;
    }
    .key-grid button.active {
      border-color: rgba(70, 209, 125, 0.42);
      color: var(--accent-success);
      background: rgba(70, 209, 125, 0.07);
    }
    .key-grid button.active kbd {
      border-color: var(--accent-success);
    }
    .utility-key {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 12px;
      color: var(--text-secondary);
      font-size: 10px;
    }
    .utility-key + .utility-key {
      margin-top: 7px;
    }
    .tip-card {
      display: flex;
      gap: 11px;
      padding: 4px 5px;
      color: var(--accent-warning);
    }
    .tip-card p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 11px;
      line-height: 1.55;
    }
    .tip-card b {
      color: var(--accent-warning);
    }
    .tip-card code {
      color: var(--text-primary);
    }
    @keyframes food-pulse {
      50% {
        transform: scale(1.12);
        filter: brightness(1.15);
      }
    }
    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .food,
      .cursor {
        animation: none;
      }
      .snake-segment {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnakePage implements OnDestroy {
  readonly gameRoot = viewChild.required<ElementRef<HTMLElement>>('gameRoot');
  readonly controls = [DIRECTIONS.h, DIRECTIONS.j, DIRECTIONS.k, DIRECTIONS.l];
  readonly status = signal<GameStatus>('ready');
  readonly snake = signal<Point[]>(this.initialSnake());
  readonly food = signal<Point>({ x: 15, y: 8 });
  readonly score = signal(0);
  readonly bestScore = signal(this.loadBestScore());
  readonly isFullscreen = signal(false);
  readonly lastKey = signal<VimKey>('l');
  readonly queuedDirection = signal<Direction>(DIRECTIONS.l);

  private currentDirection: Direction = DIRECTIONS.l;
  private timer: ReturnType<typeof setTimeout> | undefined;

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === ' ') {
      event.preventDefault();
      this.togglePause();
      return;
    }
    if (key === 'r') {
      event.preventDefault();
      this.reset();
      return;
    }
    if (key in DIRECTIONS) {
      event.preventDefault();
      this.move(key as VimKey);
    }
  }

  @HostListener('document:fullscreenchange')
  handleFullscreenChange(): void {
    this.isFullscreen.set(document.fullscreenElement === this.gameRoot().nativeElement);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  move(key: VimKey): void {
    const next = DIRECTIONS[key];
    if (next.x === -this.currentDirection.x && next.y === -this.currentDirection.y) return;
    this.queuedDirection.set(next);
    this.lastKey.set(key);
    if (this.status() === 'ready') this.begin();
    if (this.status() === 'gameover') {
      this.reset();
      this.queuedDirection.set(next);
      this.lastKey.set(key);
      this.begin();
    }
  }

  startOrRestart(): void {
    if (this.status() === 'gameover') this.reset();
    this.begin();
    if (!document.fullscreenElement) void this.enterFullscreen();
  }

  async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await this.enterFullscreen();
    } catch {
      this.isFullscreen.set(false);
    }
  }

  togglePause(): void {
    if (this.status() === 'playing') {
      this.status.set('paused');
      this.clearTimer();
    } else if (this.status() === 'paused') {
      this.status.set('playing');
      this.scheduleTick();
    } else if (this.status() === 'ready') {
      this.begin();
    }
  }

  reset(): void {
    this.clearTimer();
    this.snake.set(this.initialSnake());
    this.food.set({ x: 15, y: 8 });
    this.score.set(0);
    this.currentDirection = DIRECTIONS.l;
    this.queuedDirection.set(DIRECTIONS.l);
    this.lastKey.set('l');
    this.status.set('ready');
  }

  statusLabel(): string {
    return { ready: 'Ready', playing: 'Running', paused: 'Paused', gameover: 'Game over' }[
      this.status()
    ];
  }

  speedLabel(): string {
    return `Speed ${Math.min(9, 1 + Math.floor(this.score() / 40))}/9`;
  }

  segmentFade(index: number): number {
    return Math.max(35, 100 - index * 4);
  }

  private begin(): void {
    if (this.status() === 'playing') return;
    this.status.set('playing');
    this.scheduleTick();
  }

  private async enterFullscreen(): Promise<void> {
    if (!this.gameRoot().nativeElement.requestFullscreen) return;
    await this.gameRoot().nativeElement.requestFullscreen();
  }

  private scheduleTick(): void {
    this.clearTimer();
    const delay = Math.max(72, 155 - Math.floor(this.score() / 20) * 7);
    this.timer = setTimeout(() => this.tick(), delay);
  }

  private tick(): void {
    if (this.status() !== 'playing') return;
    this.currentDirection = this.queuedDirection();
    const current = this.snake();
    const head = current[0];
    const nextHead = { x: head.x + this.currentDirection.x, y: head.y + this.currentDirection.y };
    const ate = this.samePoint(nextHead, this.food());
    const collisionBody = ate ? current : current.slice(0, -1);
    const hitWall =
      nextHead.x < 0 || nextHead.x >= BOARD_WIDTH || nextHead.y < 0 || nextHead.y >= BOARD_HEIGHT;
    const hitSelf = collisionBody.some((segment) => this.samePoint(segment, nextHead));

    if (hitWall || hitSelf) {
      this.endGame();
      return;
    }

    const nextSnake = [nextHead, ...current];
    if (ate) {
      const nextScore = this.score() + 10;
      this.score.set(nextScore);
      this.food.set(this.findFoodPosition(nextSnake));
      if (nextScore > this.bestScore()) {
        this.bestScore.set(nextScore);
        localStorage.setItem(BEST_SCORE_KEY, String(nextScore));
      }
    } else {
      nextSnake.pop();
    }
    this.snake.set(nextSnake);
    this.scheduleTick();
  }

  private endGame(): void {
    this.clearTimer();
    this.status.set('gameover');
  }

  private findFoodPosition(occupied: Point[]): Point {
    const free: Point[] = [];
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        if (!occupied.some((segment) => segment.x === x && segment.y === y)) free.push({ x, y });
      }
    }
    return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
  }

  private initialSnake(): Point[] {
    return [
      { x: 10, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 8 },
      { x: 7, y: 8 },
    ];
  }

  private samePoint(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y;
  }

  private clearTimer(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private loadBestScore(): number {
    const value = Number(localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
}
