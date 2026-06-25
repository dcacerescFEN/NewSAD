import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PortalStore } from '../../core/stores/portal-store';

@Component({
  selector: 'app-foundation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container py-5">
      <div class="card shadow-sm border-0">
        <div class="card-body p-4">
          <p class="text-uppercase text-muted mb-2">Authenticated shell</p>
          <h1 class="h3 mb-3">NewSAD portal bootstrap</h1>
          <p class="mb-4">
            This slice keeps the migrated shell authenticated, preserves branding, footer,
            and theme preference behavior, and leaves report rendering for the next slice.
          </p>

          @if (portalStore.bootstrap(); as bootstrap) {
            <dl class="row mb-0">
              <dt class="col-sm-4">Signed-in user</dt>
              <dd class="col-sm-8">{{ bootstrap.user.displayName }} ({{ bootstrap.user.userName }})</dd>

              <dt class="col-sm-4">Navigation links discovered</dt>
              <dd class="col-sm-8">{{ navigationCount() }}</dd>

              <dt class="col-sm-4">Reports discovered</dt>
              <dd class="col-sm-8">{{ reportCount() }}</dd>

              <dt class="col-sm-4">Theme storage key</dt>
              <dd class="col-sm-8">{{ bootstrap.theme.storageKey }}</dd>
            </dl>
          }
        </div>
      </div>
    </section>
  `
})
export class Foundation {
  protected readonly portalStore = inject(PortalStore);
  protected readonly navigationCount = computed(
    () => this.portalStore.bootstrap()?.navigationLinks.length ?? 0,
  );
  protected readonly reportCount = computed(
    () => this.portalStore.bootstrap()?.reports.length ?? 0,
  );
}
