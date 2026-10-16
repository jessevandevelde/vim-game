import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStateService);
  });

  it('awards campaign XP only once', () => {
    expect(service.completeChallenge('ch1-01', 25, 3, ['l'], 0, 0, 4)).toBe(true);
    expect(service.completeChallenge('ch1-01', 25, 3, ['l'], 0, 0, 3)).toBe(false);
    expect(service.progress().xp).toBe(25);
  });

  it('does not award full mastery after one success', () => {
    service.completeChallenge('ch1-01', 25, 3, ['l'], 0, 0, 4);
    expect(service.progress().mastery['l'].score).toBeLessThan(100);
  });

  it('calculates progressively increasing level thresholds', () => {
    expect(service.xpForLevel(3) - service.xpForLevel(2)).toBeGreaterThan(service.xpForLevel(2) - service.xpForLevel(1));
  });
});
