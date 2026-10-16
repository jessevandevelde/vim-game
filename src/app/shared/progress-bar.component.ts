import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  template: '<div class="track" role="progressbar" [attr.aria-valuenow]="value()" aria-valuemin="0" aria-valuemax="100"><span [style.width.%]="value()"></span></div>',
  styles: `
    .track { height: 8px; overflow: hidden; border-radius: 99px; background: #232c38; }
    span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent-primary), #7fc4ff); box-shadow: 0 0 16px rgba(var(--accent-primary-rgb), .45); transition: width .4s ease; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent { readonly value = input(0); }
