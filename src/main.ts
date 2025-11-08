import type { ChartType } from './app.types';
import { initializeState, currentPaletteKey, DOM } from './app.state';
import { applyPalette, renderChart } from './renderers/chartjs';
import { applyThemeBackground } from './ui/theme';
import { refreshSingleSeriesOptions, updateControlVisibility } from './ui/visibility';
import { createDatasetControls } from './ui/controls';
import { bindDatasetContainer, bindGlobalControls } from './ui/bindings';
import { restoreDefaults } from './core/state';
import { showSuccessFeedback } from './ui/motion';

document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeState();
        applyPalette(currentPaletteKey);
        applyThemeBackground();
        refreshSingleSeriesOptions();
        createDatasetControls();
        updateControlVisibility(DOM.chartType.value as ChartType);
        bindDatasetContainer();
        bindGlobalControls();
        renderChart();
        DOM.resetDashboard.addEventListener('click', () => {
            restoreDefaults();
            showSuccessFeedback(DOM.resetDashboard);
        });
    } catch (error) {
        console.error('应用初始化失败:', error);
        alert('初始化应用时出现问题，请刷新页面重试。');
    }
});
