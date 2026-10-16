import { TestBed } from '@angular/core/testing';
import { VimChallenge } from '../models/game.models';
import { ChallengeEngineService } from './challenge-engine.service';

const base: VimChallenge = {
  id: 'test', chapterId: 'ch1', order: 1, title: 'Test', description: '', concept: '', objective: '', difficulty: 'beginner',
  initialContent: 'one', initialCursor: { line: 1, column: 1 }, hints: [], xpReward: 25,
  validation: [{ type: 'cursor-position', target: { line: 1, column: 3 } }],
};

describe('ChallengeEngineService', () => {
  let service: ChallengeEngineService;
  beforeEach(() => { TestBed.configureTestingModule({}); service = TestBed.inject(ChallengeEngineService); });

  it('validates a cursor target', () => {
    expect(service.validate(base, { content: 'one', cursor: { line: 1, column: 3 }, mode: 'normal', commands: ['l'], blockedInput: false }).complete).toBe(true);
  });

  it('rejects an arrow-key bypass for guided movement', () => {
    expect(service.validate(base, { content: 'one', cursor: { line: 1, column: 3 }, mode: 'normal', commands: [], blockedInput: true }).complete).toBe(false);
  });

  it('normalizes line endings for document validation', () => {
    const documentChallenge = { ...base, validation: [{ type: 'document-content' as const, expectedContent: 'one\ntwo' }] };
    expect(service.validate(documentChallenge, { content: 'one\r\ntwo', cursor: { line: 1, column: 1 }, mode: 'normal', commands: [], blockedInput: false }).complete).toBe(true);
  });

  it('rates efficient, mistake-free runs at three stars', () => {
    expect(service.efficiency(4, 4)).toBe(100);
    expect(service.stars(100, 0, 0)).toBe(3);
  });

  it('counts only meaningful keys', () => {
    expect(service.countCommandTokens(['d', 'Shift', 'w', 'Control'])).toBe(2);
  });
});
