import { Chapter, Difficulty, VimChallenge } from '../core/models/game.models';

type LessonSeed = {
  title: string; command: string; concept: string; initial?: string; expected?: string;
  target?: { line: number; column: number }; cursor?: { line: number; column: number };
  mode?: 'normal' | 'insert' | 'visual'; hint?: string; difficulty?: Difficulty;
};

const movementText = `const hero = "VimQuest";\nconst energy = 100;\nconst quest = "master motions";`;

function lesson(chapterId: string, order: number, seed: LessonSeed): VimChallenge {
  const id = `${chapterId}-${String(order).padStart(2, '0')}`;
  const initialContent = seed.initial ?? movementText;
  const initialCursor = seed.cursor ?? { line: 1, column: 1 };
  const validation = seed.expected !== undefined
    ? [{ type: 'document-content' as const, expectedContent: seed.expected }, { type: 'vim-mode' as const, expectedMode: 'normal' as const }]
    : seed.mode
      ? [{ type: 'vim-mode' as const, expectedMode: seed.mode }]
      : [{ type: 'cursor-position' as const, target: seed.target ?? { line: 1, column: Math.min(7, initialContent.split('\n')[0].length) } }];

  return {
    id, chapterId, order, title: seed.title, concept: seed.concept,
    description: `${seed.command} · ${seed.concept}`,
    objective: seed.expected !== undefined
      ? 'Transform the code into the target result, then return to Normal mode.'
      : seed.mode ? `Enter ${seed.mode.toUpperCase()} mode.` : 'Reach the glowing target using Vim — no arrows or mouse.',
    difficulty: seed.difficulty ?? (Number(chapterId.slice(2)) < 3 ? 'beginner' : Number(chapterId.slice(2)) < 7 ? 'intermediate' : 'advanced'),
    initialContent, initialCursor, validation,
    allowedCommands: seed.command.split(' / '),
    hints: [seed.hint ?? `Try ${seed.command}.`, `Keep your hands on the home row and read the mode indicator.`],
    xpReward: seed.difficulty === 'advanced' ? 100 : seed.difficulty === 'intermediate' ? 50 : 25,
    referenceSolution: seed.command,
    referenceKeystrokes: seed.command.replace(/\s/g, '').length,
    targetDecoration: seed.target,
  };
}

const seeds: Array<{ meta: Omit<Chapter, 'challenges'>; lessons: LessonSeed[] }> = [
  {
    meta: { id: 'ch1', order: 1, title: 'Getting Started', shortTitle: 'First Steps', description: 'Modes, home-row movement, and the essential edit loop.', icon: 'Footprints', difficulty: 'beginner', color: '#5ba7ff' },
    lessons: [
      { title: 'What is Vim?', command: 'l', concept: 'Vim is a language: motions are its nouns.', target: { line: 1, column: 2 } },
      { title: 'Understanding Normal Mode', command: 'Escape', concept: 'Normal mode is where commands begin.', mode: 'normal', cursor: { line: 1, column: 3 } },
      { title: 'Understanding Insert Mode', command: 'i', concept: 'Insert mode types text like a regular editor.', mode: 'insert' },
      { title: 'Move with h and l', command: 'h / l', concept: 'Move one character left or right.', cursor: { line: 1, column: 8 }, target: { line: 1, column: 3 } },
      { title: 'Move with j and k', command: 'j / k', concept: 'Move between lines without leaving home row.', target: { line: 3, column: 1 } },
      { title: 'Switching between modes', command: 'i / Escape', concept: 'Edit, then return to command mode.', initial: 'quest', expected: 'Quest', cursor: { line: 1, column: 1 }, hint: 'Press i, type Q, then Escape.' },
      { title: 'Enter text with i', command: 'i', concept: 'Insert before the cursor.', initial: 'const = true;', expected: 'const ready = true;', cursor: { line: 1, column: 7 }, hint: 'Use i, type ready, then Escape.' },
      { title: 'Append text with a', command: 'a', concept: 'Append after the cursor.', initial: 'const level = 1', expected: 'const level = 10', cursor: { line: 1, column: 15 }, hint: 'Use a, type 0, then Escape.' },
      { title: 'Create lines with o', command: 'o', concept: 'Open a new line below.', initial: 'function train() {\n}', expected: 'function train() {\n  return true;\n}', cursor: { line: 1, column: 1 }, hint: 'Use o, type two spaces and return true;, then Escape.' },
      { title: 'Movement Circuit', command: 'j / l', concept: 'Combine vertical and horizontal motions.', target: { line: 3, column: 15 } },
    ],
  },
  {
    meta: { id: 'ch2', order: 2, title: 'Efficient Navigation', shortTitle: 'Navigation', description: 'Move by intent instead of one character at a time.', icon: 'Navigation', difficulty: 'beginner', color: '#69d0a3' },
    lessons: [
      { title: 'Next word', command: 'w', concept: 'Jump to the start of the next word.', target: { line: 1, column: 7 } },
      { title: 'Move backward', command: 'b', concept: 'Jump to the previous word.', cursor: { line: 1, column: 20 }, target: { line: 1, column: 15 } },
      { title: 'Word endings', command: 'e', concept: 'Land on the end of a word.', target: { line: 1, column: 5 } },
      { title: 'Start of line', command: '0', concept: 'Jump to absolute column zero.', cursor: { line: 1, column: 18 }, target: { line: 1, column: 1 } },
      { title: 'End of line', command: '$', concept: 'Jump to the final character.', target: { line: 1, column: 24 } },
      { title: 'Across multiple lines', command: '3j', concept: 'Counts multiply motions.', initial: 'one\ntwo\nthree\nfour\nfive', target: { line: 4, column: 1 } },
      { title: 'File jumps', command: 'G', concept: 'G jumps to the final line.', target: { line: 3, column: 1 } },
      { title: 'Find a character', command: 'f"', concept: 'Find a character on the current line.', target: { line: 1, column: 14 } },
      { title: 'Numeric prefixes', command: '3w', concept: 'Say how many times before the motion.', initial: 'one two three four five', target: { line: 1, column: 15 } },
      { title: 'Navigation Sprint', command: '2j / 3w', concept: 'Compose counts and motions under pressure.', target: { line: 3, column: 15 } },
    ],
  },
  {
    meta: { id: 'ch3', order: 3, title: 'Editing Code', shortTitle: 'Editing', description: 'Delete, copy, paste, replace, undo, and repeat.', icon: 'PencilLine', difficulty: 'intermediate', color: '#f1b44c' },
    lessons: [
      { title: 'Delete a character', command: 'x', concept: 'x deletes beneath the cursor.', initial: 'const sscore = 10;', expected: 'const score = 10;', cursor: { line: 1, column: 7 } },
      { title: 'Delete a line', command: 'dd', concept: 'An operator repeated acts on the whole line.', initial: 'keep();\nremove();\nship();', expected: 'keep();\nship();', cursor: { line: 2, column: 1 } },
      { title: 'Copy a line', command: 'yy', concept: 'Yank stores text without changing it.', initial: 'const a = 1;\n', expected: 'const a = 1;\nconst a = 1;\n', cursor: { line: 1, column: 1 }, hint: 'Use yy then p.' },
      { title: 'Paste below', command: 'p', concept: 'Put yanked text after the cursor.', initial: 'north\nsouth', expected: 'north\nnorth\nsouth', cursor: { line: 1, column: 1 }, hint: 'Use yy then p.' },
      { title: 'Undo safely', command: 'u', concept: 'Undo the last change.', initial: 'safe', expected: 'safe', hint: 'Make a change with x, then restore it with u.' },
      { title: 'Redo', command: 'Ctrl+r', concept: 'Redo reverses an undo.', initial: 'redo!', expected: 'redo', cursor: { line: 1, column: 5 }, hint: 'Use x, u, then Ctrl+r.' },
      { title: 'Replace one character', command: 'r', concept: 'r swaps one character without Insert mode.', initial: 'const x = 9;', expected: 'const x = 1;', cursor: { line: 1, column: 11 }, hint: 'Press r then 1.' },
      { title: 'Change a line', command: 'cc', concept: 'Change deletes a line and enters Insert mode.', initial: 'oldValue();', expected: 'newValue();', hint: 'Use cc, type newValue();, then Escape.' },
      { title: 'Repeat a change', command: '.', concept: 'Dot repeats your last edit.', initial: 'cat cat', expected: 'bat bat', cursor: { line: 1, column: 1 }, hint: 'Use r b, then move with w and press dot.' },
      { title: 'Editing Gauntlet', command: 'dw / p', concept: 'Combine edits into a short, repeatable phrase.', initial: 'const slow fast = true;', expected: 'const fast = true;', cursor: { line: 1, column: 7 }, hint: 'Delete the unwanted word with dw.' },
    ],
  },
  {
    meta: { id: 'ch4', order: 4, title: 'Operators + Motions', shortTitle: 'Operators', description: 'Compose actions and ranges into a grammar.', icon: 'Combine', difficulty: 'intermediate', color: '#ff7c73' },
    lessons: [
      { title: 'Understanding operators', command: 'd + motion', concept: 'Operators describe an action; motions describe its range.', initial: 'remove keep', expected: 'keep', hint: 'Use dw.' },
      { title: 'Delete a word', command: 'dw', concept: 'Delete from here through the next word boundary.', initial: 'unused value', expected: 'value' },
      { title: 'Change a word', command: 'cw', concept: 'Delete a word and enter Insert mode.', initial: 'const old = true;', expected: 'const fresh = true;', cursor: { line: 1, column: 7 }, hint: 'Use cw, type fresh, then Escape.' },
      { title: 'Delete to line end', command: 'd$', concept: 'Combine delete with the end-of-line motion.', initial: 'const valid = true; // remove', expected: 'const valid = true; ', cursor: { line: 1, column: 21 } },
      { title: 'Counts with operators', command: '3dw', concept: 'Counts scale the motion inside an operator.', initial: 'one two three keep', expected: 'keep' },
      { title: 'Operator + motion', command: 'de', concept: 'Choose the motion that matches the exact range.', initial: 'draft final', expected: ' final' },
      { title: 'Modify a variable', command: 'cw', concept: 'Rename from the cursor without selecting first.', initial: 'const temp = 21;', expected: 'const celsius = 21;', cursor: { line: 1, column: 7 } },
      { title: 'Refactor multiple lines', command: '2dd', concept: 'Counts can apply to whole-line operators.', initial: 'keep\nold one\nold two\nship', expected: 'keep\nship', cursor: { line: 2, column: 1 } },
      { title: 'Optimize a sequence', command: 'D', concept: 'Prefer a direct command when it expresses the intent.', initial: 'result(); // stale note', expected: 'result(); ', cursor: { line: 1, column: 11 } },
      { title: 'Operator Mastery', command: '2dw / cw', concept: 'Plan an edit as action plus range.', initial: 'remove these finalName', expected: 'result finalName', hint: 'Delete two words, then insert result.' },
    ],
  },
  {
    meta: { id: 'ch5', order: 5, title: 'Text Objects', shortTitle: 'Text Objects', description: 'Edit semantic units without precise cursor placement.', icon: 'Brackets', difficulty: 'intermediate', color: '#ad8cff' },
    lessons: [
      { title: 'What are text objects?', command: 'iw', concept: 'Text objects describe meaningful regions.', initial: 'const alpha = 1;', expected: 'const beta = 1;', cursor: { line: 1, column: 9 }, hint: 'Use ciw, type beta, then Escape.' },
      { title: 'Inside vs around', command: 'diw / daw', concept: 'Inside preserves surrounding whitespace; around includes it.', initial: 'one extra two', expected: 'one two', cursor: { line: 1, column: 6 }, hint: 'Use daw.' },
      { title: 'Change inner word', command: 'ciw', concept: 'Rename a word from anywhere inside it.', initial: 'const username = "Jesse";', expected: 'const displayName = "Jesse";', cursor: { line: 1, column: 11 } },
      { title: 'Delete inner word', command: 'diw', concept: 'Delete only the word under the cursor.', initial: 'const unused = true;', expected: 'const  = true;', cursor: { line: 1, column: 10 } },
      { title: 'Change inside quotes', command: 'ci"', concept: 'Edit string content without touching its quotes.', initial: 'const role = "guest";', expected: 'const role = "admin";', cursor: { line: 1, column: 16 } },
      { title: 'Change around quotes', command: 'ca"', concept: 'Include delimiters in the edit.', initial: 'const role = "guest";', expected: 'const role = getRole();', cursor: { line: 1, column: 16 } },
      { title: 'Delete inside parentheses', command: 'di(', concept: 'Clear arguments while keeping parentheses.', initial: 'connect(host, port);', expected: 'connect();', cursor: { line: 1, column: 12 } },
      { title: 'Delete around parentheses', command: 'da(', concept: 'Delete contents and delimiters together.', initial: 'const value = wrap(data);', expected: 'const value = wrap;', cursor: { line: 1, column: 20 } },
      { title: 'Paragraph objects', command: 'dap', concept: 'Treat a paragraph as one editable object.', initial: 'remove this paragraph\nand this line\n\nkeep this', expected: 'keep this' },
      { title: 'Refactor a function', command: 'ciw / ci(', concept: 'Use semantic objects to reshape TypeScript.', initial: 'function oldName(value: number) { return value; }', expected: 'function double(input: number) { return input; }', cursor: { line: 1, column: 12 }, difficulty: 'advanced' },
    ],
  },
  {
    meta: { id: 'ch6', order: 6, title: 'Visual Mode', shortTitle: 'Visual', description: 'Select characters, lines, and blocks from the keyboard.', icon: 'ScanText', difficulty: 'intermediate', color: '#d77cf1' },
    lessons: [
      { title: 'Enter Visual Mode', command: 'v', concept: 'Start a character-wise selection.', mode: 'visual' },
      { title: 'Select text', command: 'v / e', concept: 'Extend a visual selection with motions.', initial: 'select this word', expected: ' word', hint: 'Use v, e, then d.' },
      { title: 'Visual Line Mode', command: 'V', concept: 'Select complete lines.', initial: 'remove me\nkeep me', expected: 'keep me', hint: 'Use V then d.' },
      { title: 'Visual Block Mode', command: 'Ctrl+v', concept: 'Select rectangular regions when the Vim engine supports it.', mode: 'visual', hint: 'Press Ctrl+v. The integration reports Visual mode for block selections.' },
      { title: 'Delete a selection', command: 'v / d', concept: 'Apply an operator to a visual range.', initial: 'delete keep', expected: ' keep', hint: 'Use v, e, d.' },
      { title: 'Copy a selection', command: 'v / y / p', concept: 'Yank a visual range and put it elsewhere.', initial: 'go ', expected: 'go go', hint: 'Select go with v then e, yank, go to the end and paste.' },
      { title: 'Replace selected text', command: 'v / c', concept: 'Change a selection and enter Insert mode.', initial: 'red status', expected: 'green status' },
      { title: 'Selection with motions', command: 'v / 2w', concept: 'Motions work inside Visual mode too.', initial: 'one two keep', expected: 'keep', hint: 'Use v, 2w, d.' },
      { title: 'Select code blocks', command: 'v / %', concept: 'Matching-bracket motions can extend selections.', initial: 'if (ready) { run(); }', expected: 'if (ready) ', cursor: { line: 1, column: 12 }, hint: 'Use v, %, d.' },
      { title: 'Visual Finale', command: 'V / d', concept: 'Make line-wise changes confidently.', initial: 'keep\nremove one\nremove two\nship', expected: 'keep\nship', cursor: { line: 2, column: 1 } },
    ],
  },
  {
    meta: { id: 'ch7', order: 7, title: 'Searching', shortTitle: 'Search', description: 'Find intent quickly in real source files.', icon: 'Search', difficulty: 'intermediate', color: '#49cbd2' },
    lessons: [
      { title: 'Search forward', command: '/quest', concept: 'Search forward by pattern.', target: { line: 3, column: 7 }, hint: 'Type /quest and press Enter.' },
      { title: 'Search backward', command: '?const', concept: 'Search toward the top of the file.', cursor: { line: 3, column: 10 }, target: { line: 2, column: 1 } },
      { title: 'Next match', command: 'n', concept: 'Repeat the current search in the same direction.', initial: 'token one\ntoken two\ntoken three', cursor: { line: 1, column: 1 }, target: { line: 2, column: 1 } },
      { title: 'Reverse match', command: 'N', concept: 'Repeat the search in the opposite direction.', initial: 'token one\ntoken two\ntoken three', cursor: { line: 3, column: 1 }, target: { line: 2, column: 1 } },
      { title: 'Word under cursor', command: '*', concept: 'Search forward for the current word.', initial: 'score = score + bonus', cursor: { line: 1, column: 1 }, target: { line: 1, column: 9 } },
      { title: 'Search backward for word', command: '#', concept: 'Search backward for the current word.', initial: 'score = score + bonus', cursor: { line: 1, column: 10 }, target: { line: 1, column: 1 } },
      { title: 'Search and replace', command: ':%s/old/new/g', concept: 'Ex commands can transform every match.', initial: 'old one\nold two', expected: 'new one\nnew two' },
      { title: 'Find variables', command: '* / n', concept: 'Follow a symbol through a file.', initial: 'const total = 1;\nlog(total);\nreturn total;', cursor: { line: 1, column: 7 }, target: { line: 3, column: 8 } },
      { title: 'Navigate a codebase', command: '/return', concept: 'Pattern search beats scanning.', target: { line: 3, column: 1 } },
      { title: 'Search Mastery', command: '* / n', concept: 'Chain search repeats to reach the right occurrence.', initial: 'item\nitem\ntarget item', cursor: { line: 1, column: 1 }, target: { line: 3, column: 8 } },
    ],
  },
  {
    meta: { id: 'ch8', order: 8, title: 'VS Code Integration', shortTitle: 'VS Code', description: 'Use Vim alongside VS Code features and shortcuts.', icon: 'PanelsTopLeft', difficulty: 'advanced', color: '#3f9cec' },
    lessons: [
      { title: 'Install VSCodeVim', command: 'Escape', concept: 'VSCodeVim brings modal editing into VS Code.', mode: 'normal' },
      { title: 'Mode indicators', command: 'i / Escape', concept: 'Always know which mode receives your next key.', mode: 'insert' },
      { title: 'Editor tabs', command: 'VS Code shortcut', concept: 'Tab movement is a VS Code binding, not core Vim.', target: { line: 1, column: 7 } },
      { title: 'Between files', command: 'Command Palette', concept: 'Use VS Code navigation for files unless you configure mappings.', target: { line: 2, column: 1 } },
      { title: 'Command palette', command: 'Ctrl+Shift+P', concept: 'The palette remains a VS Code feature.', target: { line: 1, column: 7 } },
      { title: 'Editor groups', command: 'VS Code shortcut', concept: 'Group focus bindings are configurable.', target: { line: 3, column: 1 } },
      { title: 'Shortcut harmony', command: 'Escape', concept: 'Keep editor commands local and app shortcuts intentional.', mode: 'normal' },
      { title: 'Keybinding conflicts', command: 'i / Escape', concept: 'Let VSCodeVim handle editor keys and VS Code handle workbench keys.', mode: 'insert' },
      { title: 'Recommended settings', command: 'jj mapping (optional)', concept: 'Custom mappings are optional, never assumed.', target: { line: 1, column: 7 } },
      { title: 'Workflow Challenge', command: 'G / $', concept: 'Combine Vim motions inside a VS Code-like editor.', target: { line: 3, column: 32 }, difficulty: 'advanced' },
    ],
  },
  {
    meta: { id: 'ch9', order: 9, title: 'Advanced Vim', shortTitle: 'Advanced', description: 'Refactor confidently with compound, repeatable edits.', icon: 'Swords', difficulty: 'advanced', color: '#ff657a' },
    lessons: [
      { title: 'Advanced motions', command: '%', concept: 'Jump between matching delimiters.', initial: 'const config = { enabled: true };', cursor: { line: 1, column: 16 }, target: { line: 1, column: 32 } },
      { title: 'Compound operators', command: 'd2w', concept: 'Counts can sit between operator and motion.', initial: 'drop both keep', expected: 'keep' },
      { title: 'Efficient refactoring', command: 'ciw / n / .', concept: 'Search and dot-repeat turn one edit into a pattern.', initial: 'let foo = foo + 1;', expected: 'let count = count + 1;' },
      { title: 'Repeat modifications', command: '.', concept: 'Make the next edit cheap by designing the first one well.', initial: 'one! two!', expected: 'one? two?', cursor: { line: 1, column: 4 } },
      { title: 'Function parameters', command: 'ci(', concept: 'Replace a whole argument list as one object.', initial: 'calculate(price, tax);', expected: 'calculate(subtotal, rate);', cursor: { line: 1, column: 15 } },
      { title: 'HTML tags', command: 'cit', concept: 'Tag text objects work in full Vim; support can vary by integration.', initial: '<strong>old</strong>', expected: '<strong>new</strong>', cursor: { line: 1, column: 10 } },
      { title: 'Nested brackets', command: 'di(', concept: 'Operate on the nearest enclosing pair.', initial: 'run(format(value));', expected: 'run(format());', cursor: { line: 1, column: 13 } },
      { title: 'Arrays and objects', command: 'ci[', concept: 'Delimiter text objects scale to data structures.', initial: 'const ids = [1, 2, 3];', expected: 'const ids = [4, 5];', cursor: { line: 1, column: 15 } },
      { title: 'Optimize sequences', command: 'ciw / w / .', concept: 'Shape edits so dot-repeat can reuse them.', initial: 'bad bad bad', expected: 'good good good' },
      { title: 'Vim Mastery', command: 'ciw / n / .', concept: 'Combine search, text objects, and repetition.', initial: 'const price = 100;\nreturn price + price;', expected: 'const subtotal = 100;\nreturn subtotal + subtotal;', cursor: { line: 1, column: 8 }, difficulty: 'advanced' },
    ],
  },
];

export const CHAPTERS: Chapter[] = seeds.map(group => ({
  ...group.meta,
  challenges: group.lessons.map((seed, index) => lesson(group.meta.id, index + 1, seed)),
}));

export const ALL_CHALLENGES = CHAPTERS.flatMap(chapter => chapter.challenges);

export function challengeById(id: string | null): VimChallenge {
  return ALL_CHALLENGES.find(challenge => challenge.id === id) ?? ALL_CHALLENGES[0];
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dailyChallenge(date = new Date()): VimChallenge {
  const key = localDateKey(date);
  let hash = 2166136261;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return ALL_CHALLENGES[Math.abs(hash) % ALL_CHALLENGES.length];
}
