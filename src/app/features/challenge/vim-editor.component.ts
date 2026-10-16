import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import * as monaco from 'monaco-editor';
import { initVimMode, VimAdapterInstance } from 'monaco-vim';
import { GameSettings, VimChallenge, VimMode } from '../../core/models/game.models';

type EditorSnapshot = { content: string; cursor: { line: number; column: number }; mode: VimMode; selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number } };

const monacoGlobal = self as typeof self & { MonacoEnvironment?: { getWorker: (moduleId: string, label: string) => Worker } };
monacoGlobal.MonacoEnvironment = {
  getWorker: (_moduleId: string, label: string) => label === 'typescript' || label === 'javascript'
    ? new Worker(new URL('../../../typescript.worker.ts', import.meta.url), { type: 'module' })
    : new Worker(new URL('../../../monaco.worker.ts', import.meta.url), { type: 'module' }),
};

@Component({
  selector: 'app-vim-editor',
  template: `<div class="editor-shell"><div #editorHost class="editor-host" (mousedown)="onPointer()"></div><div #statusHost class="vim-status" aria-live="polite"></div></div>`,
  styles: `
    :host{display:block;min-height:0}.editor-shell{height:100%;min-height:405px;position:relative;background:#0b0f14}.editor-host{position:absolute;inset:0}.vim-status{position:absolute;left:12px;bottom:8px;z-index:2;max-width:calc(100% - 24px);color:#8d9caf;font:12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;pointer-events:none}.vim-status:empty{display:none}
    :host ::ng-deep .target-char{background:rgba(91,167,255,.28);outline:1px solid #72b7ff;border-radius:2px;animation:target-pulse 1.4s infinite}.editor-shell::after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 40px rgba(0,0,0,.2)}
    @keyframes target-pulse{50%{background:rgba(91,167,255,.48);box-shadow:0 0 12px rgba(91,167,255,.35)}}
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VimEditorComponent implements AfterViewInit, OnDestroy {
  readonly challenge = input.required<VimChallenge>();
  readonly settings = input.required<GameSettings>();
  readonly snapshotChange = output<EditorSnapshot>();
  readonly vimKey = output<string>();
  readonly physicalKey = output<string>();
  readonly modeChange = output<VimMode>();
  readonly blockedInput = output<'mouse' | 'arrow' | 'paste'>();
  private readonly editorHost = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private readonly statusHost = viewChild.required<ElementRef<HTMLElement>>('statusHost');
  private editor?: monaco.editor.IStandaloneCodeEditor;
  private model?: monaco.editor.ITextModel;
  private vim?: VimAdapterInstance;
  private decorations?: monaco.editor.IEditorDecorationsCollection;
  private mode: VimMode = 'normal';
  private disposables: monaco.IDisposable[] = [];
  private initializing = true;
  private pointerPosition?: string;
  private readonly nativeKeyHandler = (event: KeyboardEvent): void => {
    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    event.stopPropagation();
    this.blockedInput.emit('arrow');
    this.physicalKey.emit(this.prettyKey(event));
  };

  constructor() {
    effect(() => {
      const challenge = this.challenge();
      if (this.editor) this.loadChallenge(challenge);
    });
    effect(() => {
      const settings = this.settings();
      this.editor?.updateOptions({ fontSize: settings.fontSize, tabSize: settings.tabSize, lineNumbers: settings.lineNumbers ? 'on' : 'off', cursorStyle: this.cursorStyle(settings.cursorStyle) });
    });
  }

  ngAfterViewInit(): void {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
    monaco.editor.defineTheme('vimquest-midnight', { base: 'vs-dark', inherit: true, rules: [
      { token: 'keyword', foreground: 'C792EA' }, { token: 'string', foreground: 'A5D6A7' }, { token: 'number', foreground: 'FFCB6B' }, { token: 'comment', foreground: '637083', fontStyle: 'italic' },
    ], colors: { 'editor.background': '#0B0F14', 'editor.foreground': '#CED7E3', 'editorLineNumber.foreground': '#3F4A58', 'editorLineNumber.activeForeground': '#8BA1B7', 'editor.lineHighlightBackground': '#111821', 'editorCursor.foreground': '#70B7FF', 'editor.selectionBackground': '#254A6E80' } });
    const settings = this.settings();
    this.model = monaco.editor.createModel(this.challenge().initialContent, 'typescript');
    this.editor = monaco.editor.create(this.editorHost().nativeElement, {
      model: this.model, theme: 'vimquest-midnight', automaticLayout: true, minimap: { enabled: false },
      fontFamily: 'JetBrains Mono, Cascadia Code, SFMono-Regular, Consolas, monospace', fontSize: settings.fontSize,
      lineHeight: Math.round(settings.fontSize * 1.65), tabSize: settings.tabSize, lineNumbers: settings.lineNumbers ? 'on' : 'off',
      cursorStyle: this.cursorStyle(settings.cursorStyle), cursorBlinking: 'solid', padding: { top: 18, bottom: 34 },
      scrollBeyondLastLine: false, wordWrap: 'off', glyphMargin: false, folding: false, overviewRulerLanes: 0,
      renderLineHighlight: 'all', smoothScrolling: true, bracketPairColorization: { enabled: true }, contextmenu: false,
      quickSuggestions: false, suggest: { showWords: false },
    });
    this.editorHost().nativeElement.addEventListener('keydown', this.nativeKeyHandler, true);
    this.disposables.push(
      this.editor.onKeyDown(event => {
        if ((event.ctrlKey || event.metaKey) && event.browserEvent.key.toLowerCase() === 'v') { event.preventDefault(); event.stopPropagation(); this.blockedInput.emit('paste'); }
        this.physicalKey.emit(this.prettyKey(event.browserEvent));
      }),
      this.editor.onDidChangeCursorPosition(() => this.emitSnapshot()),
      this.editor.onDidChangeCursorSelection(() => this.emitSnapshot()),
      this.editor.onDidChangeModelContent(() => this.emitSnapshot()),
    );
    this.vim = initVimMode(this.editor, this.statusHost().nativeElement);
    this.vim.on('vim-mode-change', (event: { mode: string }) => {
      this.mode = this.asMode(event.mode);
      this.modeChange.emit(this.mode);
      this.emitSnapshot();
    });
    this.vim.on('vim-keypress', (key: string) => this.vimKey.emit(key));
    this.loadChallenge(this.challenge());
  }

  reset(): void { this.loadChallenge(this.challenge()); }
  focus(): void { this.editor?.focus(); }
  onPointer(): void {
    const position = this.editor?.getPosition();
    this.pointerPosition = position ? `${position.lineNumber}:${position.column}` : undefined;
    queueMicrotask(() => {
      const next = this.editor?.getPosition();
      if (!this.initializing && this.pointerPosition && next && this.pointerPosition !== `${next.lineNumber}:${next.column}`) this.blockedInput.emit('mouse');
    });
  }

  ngOnDestroy(): void {
    this.editorHost().nativeElement.removeEventListener('keydown', this.nativeKeyHandler, true);
    this.disposables.forEach(item => item.dispose());
    this.decorations?.clear();
    this.vim?.dispose();
    this.editor?.dispose();
    this.model?.dispose();
  }

  private loadChallenge(challenge: VimChallenge): void {
    if (!this.editor || !this.model) return;
    this.initializing = true;
    this.vim?.dispose();
    this.model.setValue(challenge.initialContent);
    this.editor.setPosition({ lineNumber: challenge.initialCursor.line, column: challenge.initialCursor.column });
    this.editor.setSelection(new monaco.Selection(challenge.initialCursor.line, challenge.initialCursor.column, challenge.initialCursor.line, challenge.initialCursor.column));
    this.mode = 'normal';
    this.vim = initVimMode(this.editor, this.statusHost().nativeElement);
    this.vim.on('vim-mode-change', (event: { mode: string }) => { this.mode = this.asMode(event.mode); this.modeChange.emit(this.mode); this.emitSnapshot(); });
    this.vim.on('vim-keypress', (key: string) => this.vimKey.emit(key));
    this.decorations?.clear();
    if (challenge.targetDecoration) {
      const target = challenge.targetDecoration;
      this.decorations = this.editor.createDecorationsCollection([{ range: new monaco.Range(target.line, target.column, target.line, target.column + 1), options: { inlineClassName: 'target-char' } }]);
    }
    this.editor.revealPositionInCenter({ lineNumber: challenge.initialCursor.line, column: challenge.initialCursor.column });
    queueMicrotask(() => { this.initializing = false; this.editor?.focus(); this.emitSnapshot(); });
  }

  private emitSnapshot(): void {
    if (!this.editor || this.initializing) return;
    const position = this.editor.getPosition(); const selection = this.editor.getSelection();
    if (!position) return;
    this.snapshotChange.emit({ content: this.editor.getValue(), cursor: { line: position.lineNumber, column: position.column }, mode: this.mode, selection: selection ? { startLine: selection.startLineNumber, startColumn: selection.startColumn, endLine: selection.endLineNumber, endColumn: selection.endColumn } : undefined });
  }
  private asMode(mode: string): VimMode { return mode.includes('visual') ? 'visual' : mode === 'insert' ? 'insert' : mode === 'replace' ? 'replace' : 'normal'; }
  private cursorStyle(style: GameSettings['cursorStyle']): 'line' | 'block' | 'underline' { return style; }
  private prettyKey(event: KeyboardEvent): string {
    if (event.key === 'Escape') return 'Esc'; if (event.key === ' ') return 'Space'; if (event.key === 'Enter') return '↵';
    const prefix = event.ctrlKey ? 'Ctrl+' : event.metaKey ? 'Cmd+' : event.altKey ? 'Alt+' : '';
    return `${prefix}${event.key.length === 1 ? event.key : event.key.replace('Arrow', '↑↓←→'[['Up','Down','Left','Right'].indexOf(event.key.replace('Arrow',''))] ?? event.key)}`;
  }
}
