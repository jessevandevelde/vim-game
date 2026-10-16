import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { CHAPTERS } from '../../data/campaign.data';
import { IconComponent } from '../../shared/icon.component';

@Component({
  imports:[RouterLink,IconComponent],
  template:`<div class="page"><header class="page-header"><div><p class="eyebrow">Practice lab</p><h1>Sharpen one skill.</h1><p class="subtitle">Unlimited repetitions with focused challenge sets. Practice never changes campaign unlocks or awards repeat XP.</p></div></header>
    <div class="categories">@for(category of categories;track category.title){<article class="card"><span class="icon"><app-icon [name]="category.icon" [size]="24" /></span><div class="tag">{{ category.label }}</div><h2>{{ category.title }}</h2><p>{{ category.description }}</p><div class="commands">@for(command of category.commands;track command){<kbd>{{command}}</kbd>}</div><a class="btn ghost" [routerLink]="['/challenge',category.challenge]">Start session <app-icon name="ArrowRight" [size]="16" /></a></article>}</div>
    <section class="recommend card"><div><p class="eyebrow">Recommended for you</p><h2>{{ recommendation().title }}</h2><p>Built from your lowest-confidence command family. Repetition raises mastery gradually—one success is never treated as 100%.</p></div><a class="btn primary" [routerLink]="['/challenge',recommendation().id]">Practice now</a></section>
  </div>`,
  styles:`.categories{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.categories article{padding:22px;box-shadow:none}.icon{width:46px;height:46px;display:grid;place-items:center;margin-bottom:20px;border-radius:12px;color:var(--accent-primary);background:rgba(var(--accent-primary-rgb),.11)}.tag{color:var(--text-muted);font-size:9px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.categories h2{margin:8px 0;font-size:18px}.categories p{min-height:52px;color:var(--text-secondary);font-size:12px;line-height:1.5}.commands{display:flex;flex-wrap:wrap;gap:6px;min-height:56px;margin:18px 0}.commands kbd{padding:5px 8px;border:1px solid var(--border-primary);border-radius:5px;color:#bfd5eb;background:#151d27;font:700 11px ui-monospace}.categories .btn{width:100%}.recommend{display:flex;justify-content:space-between;align-items:center;gap:25px;margin-top:22px;padding:24px;background:linear-gradient(120deg,rgba(91,167,255,.1),transparent),var(--bg-secondary)}.recommend h2{margin:5px 0}.recommend p{margin:0;color:var(--text-secondary);font-size:12px}@media(max-width:1000px){.categories{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.categories{grid-template-columns:1fr}.recommend{align-items:flex-start;flex-direction:column}}`,
  changeDetection:ChangeDetectionStrategy.OnPush,
})
export class PracticePage{
  private readonly state=inject(GameStateService);
  readonly categories=[
    {title:'Home Row Control',label:'Movement',icon:'Move',commands:['h','j','k','l'],description:'Build confident, arrow-free cursor control.',challenge:'ch1-10'},
    {title:'Word Motions',label:'Navigation',icon:'WholeWord',commands:['w','b','e'],description:'Move in meaningful chunks across real code.',challenge:'ch2-10'},
    {title:'Operator Grammar',label:'Editing',icon:'Combine',commands:['dw','cw','d$'],description:'Compose actions with precise ranges.',challenge:'ch4-10'},
    {title:'Text Objects',label:'Precision',icon:'Brackets',commands:['ciw','diw','ci"'],description:'Edit semantic units from anywhere inside them.',challenge:'ch5-10'},
    {title:'Visual Selections',label:'Selection',icon:'ScanText',commands:['v','V','Ctrl+v'],description:'Select characters, lines, and code blocks.',challenge:'ch6-10'},
    {title:'Search & Repeat',label:'Scale',icon:'Search',commands:['/','n','*','.'],description:'Turn one correct edit into a repeatable workflow.',challenge:'ch7-10'},
  ];
  recommendation(){const scores=this.state.progress().mastery;const lowest=Object.entries(scores).sort((a,b)=>a[1].score-b[1].score)[0]?.[0];const challenge=lowest?.includes('w')?CHAPTERS[1].challenges[0]:CHAPTERS[4].challenges[2];return challenge;}
}
