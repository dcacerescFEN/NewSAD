import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DashboardComponent } from './dashboard';

describe('DashboardComponent', () => {
    afterEach(() => TestBed.resetTestingModule());

    async function createDashboard() {
        const fixture = TestBed.createComponent(DashboardComponent);
        await fixture.whenStable();
        const root = fixture.nativeElement as HTMLElement;
        const totalTab = root.querySelector<HTMLButtonElement>('#total-students-tab')!;
        const newTab = root.querySelector<HTMLButtonElement>('#new-students-tab')!;
        return { fixture, root, totalTab, newTab };
    }

    it('shows the total report and does not create the new report before selection', async () => {
        const { root, totalTab, newTab } = await createDashboard();

        expect(root.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Reportes de alumnos');
        expect(totalTab.textContent).toContain('Total Alumnos');
        expect(newTab.textContent).toContain('Nuevos Alumnos');
        expect(totalTab.getAttribute('aria-selected')).toBe('true');
        expect(totalTab.tabIndex).toBe(0);
        expect(newTab.tabIndex).toBe(-1);
        expect(root.querySelector('#total-students-panel iframe')?.getAttribute('src')).toMatch(/^https:\/\/app\.powerbi\.com\/view\?r=/);
        expect(root.querySelector('#new-students-panel iframe')).toBeNull();
    });

    it('loads the new report once selected and keeps it mounted when switching back', async () => {
        const { fixture, root, totalTab, newTab } = await createDashboard();

        newTab.click();
        await fixture.whenStable();

        const newFrame = root.querySelector('#new-students-panel iframe');
        expect(newFrame?.getAttribute('src')).toMatch(/^https:\/\/app\.powerbi\.com\/view\?r=/);
        expect(newFrame?.getAttribute('src')).not.toBe(root.querySelector('#total-students-panel iframe')?.getAttribute('src'));
        expect(newTab.getAttribute('aria-selected')).toBe('true');
        expect(root.querySelector('#total-students-panel')?.hasAttribute('hidden')).toBe(true);

        totalTab.click();
        await fixture.whenStable();

        expect(totalTab.getAttribute('aria-selected')).toBe('true');
        expect(root.querySelector('#new-students-panel')?.hasAttribute('hidden')).toBe(true);
        expect(root.querySelector('#new-students-panel iframe')).toBe(newFrame);
    });

    it('supports arrow keys, Home and End with roving focus', async () => {
        const { fixture, root, totalTab, newTab } = await createDashboard();

        totalTab.focus();
        totalTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
        await fixture.whenStable();
        expect(document.activeElement).toBe(newTab);
        expect(newTab.getAttribute('aria-selected')).toBe('true');
        expect(newTab.tabIndex).toBe(0);
        expect(root.querySelector('#new-students-panel iframe')).not.toBeNull();

        newTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
        await fixture.whenStable();
        expect(document.activeElement).toBe(totalTab);
        expect(totalTab.getAttribute('aria-selected')).toBe('true');

        totalTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
        await fixture.whenStable();
        expect(document.activeElement).toBe(newTab);

        newTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
        await fixture.whenStable();
        expect(document.activeElement).toBe(totalTab);
    });
});
