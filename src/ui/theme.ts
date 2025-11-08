import { DOM } from '../app.state';
import { normalizeColorToHex } from '../utils/color';
import { getCanvasBackgroundColor } from '../utils/dom';
import { renderChart } from '../renderers/chartjs';

export function applyThemeBackground(): void {
    const defaultColor = normalizeColorToHex(getCanvasBackgroundColor());
    DOM.exportBg.value = defaultColor;
}

export function applyLightTheme(): void {
    document.documentElement.setAttribute('data-theme', 'light');
    DOM.themeLight.classList.add('active');
    DOM.themeDark.classList.remove('active');
    applyThemeBackground();
    renderChart();
    setTimeout(() => {
        document.body.classList.remove('theme-switching');
    }, 400);
}

export function applyDarkTheme(): void {
    document.documentElement.setAttribute('data-theme', 'dark');
    DOM.themeDark.classList.add('active');
    DOM.themeLight.classList.remove('active');
    applyThemeBackground();
    renderChart();
    setTimeout(() => {
        document.body.classList.remove('theme-switching');
    }, 400);
}
