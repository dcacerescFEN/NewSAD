import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  template: ` 
    <footer class="layout-footer">
      <span>Facultad de Economía y Negocios - Universidad de Chile</span>
      <span>Version 1.0.0</span>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .layout-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.15rem;
      border: 1px solid var(--layout-border-color);
      background: var(--layout-surface);
      color: var(--layout-muted-text);
      font-size: 0.84rem;
      font-weight: 600;
    }
  `,
})
export class Footer {}
