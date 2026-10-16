import { Injectable } from '@angular/core';
import { ChallengeSnapshot, VimChallenge, ValidationResult } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class ChallengeEngineService {
  validate(challenge: VimChallenge, snapshot: ChallengeSnapshot): ValidationResult {
    const messages: string[] = [];
    if (snapshot.blockedInput && challenge.validation.some(rule => rule.type === 'cursor-position')) {
      messages.push('Arrows and mouse movement do not count for this guided motion. Reset and use Vim motions.');
    }
    for (const rule of challenge.validation) {
      if (rule.type === 'cursor-position' && (snapshot.cursor.line !== rule.target.line || snapshot.cursor.column !== rule.target.column)) {
        messages.push(`Move to line ${rule.target.line}, column ${rule.target.column}.`);
      }
      if (rule.type === 'document-content' && this.normalize(snapshot.content) !== this.normalize(rule.expectedContent)) {
        messages.push('The document does not match the target yet.');
      }
      if (rule.type === 'vim-mode' && snapshot.mode !== rule.expectedMode) {
        messages.push(`Return to ${rule.expectedMode.toUpperCase()} mode.`);
      }
      if (rule.type === 'required-commands' && !rule.commands.every(command => snapshot.commands.includes(command))) {
        messages.push('Use the Vim command taught in this lesson.');
      }
      if (rule.type === 'selection-range') {
        const selection = snapshot.selection;
        if (!selection || selection.startLine !== rule.target.startLine || selection.startColumn !== rule.target.startColumn || selection.endLine !== rule.target.endLine || selection.endColumn !== rule.target.endColumn) {
          messages.push('Adjust the selection to the highlighted range.');
        }
      }
    }
    return { complete: messages.length === 0, messages };
  }

  countCommandTokens(keys: string[]): number {
    return keys.filter(key => !['Shift', 'Control', 'Alt', 'Meta'].includes(key)).length;
  }

  efficiency(reference: number | undefined, actual: number): number {
    if (!reference || actual <= 0) return 100;
    return Math.max(25, Math.min(100, Math.round((reference / actual) * 100)));
  }

  stars(efficiency: number, mistakes: number, hints: number): number {
    if (efficiency >= 90 && mistakes === 0 && hints === 0) return 3;
    if (efficiency >= 65 && mistakes <= 2) return 2;
    return 1;
  }

  private normalize(value: string): string { return value.replace(/\r\n/g, '\n').trimEnd(); }
}
