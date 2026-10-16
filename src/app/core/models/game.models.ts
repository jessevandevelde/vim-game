export type VimMode = 'normal' | 'insert' | 'visual' | 'replace';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CursorPosition { line: number; column: number; }
export interface SelectionRange { startLine: number; startColumn: number; endLine: number; endColumn: number; }

export type ChallengeRule =
  | { type: 'cursor-position'; target: CursorPosition }
  | { type: 'document-content'; expectedContent: string }
  | { type: 'vim-mode'; expectedMode: VimMode }
  | { type: 'selection-range'; target: SelectionRange }
  | { type: 'required-commands'; commands: string[] };

export interface VimChallenge {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  description: string;
  concept: string;
  objective: string;
  difficulty: Difficulty;
  initialContent: string;
  initialCursor: CursorPosition;
  validation: ChallengeRule[];
  allowedCommands?: string[];
  hints: string[];
  xpReward: number;
  referenceSolution?: string;
  referenceKeystrokes?: number;
  targetDecoration?: CursorPosition;
}

export interface Chapter {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
  color: string;
  challenges: VimChallenge[];
}

export interface MasteryRecord {
  attempts: number;
  successes: number;
  mistakes: number;
  hints: number;
  score: number;
  lastPracticed: string;
}

export interface PlayerProgress {
  schemaVersion: 1;
  xp: number;
  completedChallenges: string[];
  stars: Record<string, number>;
  mastery: Record<string, MasteryRecord>;
  achievements: string[];
  personalBests: Record<string, number>;
  totalPracticeSeconds: number;
  dailyCompleted: string[];
  recentActivity: Array<{ challengeId: string; completedAt: string; stars: number }>;
}

export interface GameSettings {
  theme: 'midnight' | 'dim';
  fontSize: number;
  tabSize: number;
  lineNumbers: boolean;
  cursorStyle: 'line' | 'block' | 'underline';
  soundEffects: boolean;
  animations: boolean;
  commandHints: boolean;
  timer: boolean;
}

export interface ChallengeSnapshot {
  content: string;
  cursor: CursorPosition;
  mode: VimMode;
  selection?: SelectionRange;
  commands: string[];
  blockedInput: boolean;
}

export interface ValidationResult { complete: boolean; messages: string[]; }
