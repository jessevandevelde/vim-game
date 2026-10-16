import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, viewChild } from '@angular/core';
import { createElement, IconNode, icons } from 'lucide';

@Component({
  selector: 'app-icon',
  template: '<span #host class="icon-host" aria-hidden="true"></span>',
  styles: ':host { display:inline-flex; line-height:0 } .icon-host { display:inline-flex }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements AfterViewInit {
  readonly name = input.required<string>();
  readonly size = input(18);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  ngAfterViewInit(): void {
    const icon = icons[this.name() as keyof typeof icons] as IconNode | undefined;
    if (icon) this.host().nativeElement.replaceChildren(createElement(icon, { width: this.size(), height: this.size(), 'stroke-width': 2 }));
  }
}
