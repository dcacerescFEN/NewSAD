import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type ReportTab = 'total' | 'new';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss'
})
export class DashboardComponent {
    protected readonly selectedTab = signal<ReportTab>('total');
    protected readonly hasOpenedNewReport = signal(false);

    protected selectTab(tab: ReportTab): void {
        this.selectedTab.set(tab);
        if (tab === 'new') {
            this.hasOpenedNewReport.set(true);
        }
    }

    protected onTabKeydown(event: KeyboardEvent, totalTab: HTMLButtonElement, newTab: HTMLButtonElement): void {
        const tabs = [totalTab, newTab];
        const currentIndex = tabs.indexOf(event.target as HTMLButtonElement);
        if (currentIndex < 0) return;

        let nextIndex: number;
        switch (event.key) {
            case 'ArrowRight':
                nextIndex = (currentIndex + 1) % tabs.length;
                break;
            case 'ArrowLeft':
                nextIndex = (currentIndex + tabs.length - 1) % tabs.length;
                break;
            case 'Home':
                nextIndex = 0;
                break;
            case 'End':
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        this.selectTab(nextIndex === 0 ? 'total' : 'new');
        tabs[nextIndex].focus();
    }
}
