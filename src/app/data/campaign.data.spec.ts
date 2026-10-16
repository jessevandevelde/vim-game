import { ALL_CHALLENGES, CHAPTERS, dailyChallenge, localDateKey } from './campaign.data';

describe('campaign data', () => {
  it('contains nine complete ten-lesson chapters', () => {
    expect(CHAPTERS).toHaveLength(9);
    expect(CHAPTERS.every(chapter => chapter.challenges.length === 10)).toBe(true);
    expect(ALL_CHALLENGES).toHaveLength(90);
  });

  it('generates the same daily challenge for the same local date', () => {
    const date = new Date(2026, 9, 16, 23, 59);
    expect(localDateKey(date)).toBe('2026-10-16');
    expect(dailyChallenge(date).id).toBe(dailyChallenge(new Date(2026, 9, 16, 1, 1)).id);
  });

  it('gives every challenge a playable validation rule and hint', () => {
    expect(ALL_CHALLENGES.every(challenge => challenge.validation.length > 0 && challenge.hints.length > 0)).toBe(true);
  });
});
