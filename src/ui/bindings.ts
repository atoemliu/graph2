import type { ChartType, ExportFormat, PaletteKey } from '../app.types';
import {
    DOM,
    initialData,
    setOrientation,
    currentPaletteKey
} from '../app.state';
import { getColorPalette } from '../app.constants';
import { debounce } from '../utils/helpers';
import * as ColorUtils from '../utils/color';
import * as DataUtils from '../utils/data';
import { renderChart, applyPalette } from '../renderers/chartjs';
import { createDatasetControls, buildMixedTypeSelectors } from './controls';
import { refreshSingleSeriesOptions, updateControlVisibility } from './visibility';
import { animateChartTransition, showSuccessFeedback } from './motion';
import { applyLightTheme, applyDarkTheme } from './theme';
import { exportChartImage } from '../core/export';
import { restoreDefaults } from '../core/state';

const debounceFastRender = debounce(renderChart, 100);

export function bindDatasetContainer(): void {
    const container = DOM.datasetContainer;
    if (!container) return;

    container.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target && target.matches('[id^="dataset-name-done-"]')) {
            const index = parseInt(target.id.replace('dataset-name-done-', ''), 10);
            const nameInput = document.getElementById(`dataset-name-${index}`) as HTMLInputElement | null;
            if (nameInput && initialData.datasets[index]) {
                initialData.datasets[index].label = nameInput.value;
                refreshSingleSeriesOptions();
                renderChart();
                showSuccessFeedback(target);
            }
        }
    });

    container.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (target && target.matches('[id^="dataset-color-"]')) {
            const index = parseInt(target.id.replace('dataset-color-', ''), 10);
            const dataset = initialData.datasets[index];
            if (dataset) {
                dataset.backgroundColor = ColorUtils.hexToRgba(target.value, 0.7);
                dataset.borderColor = ColorUtils.hexToRgba(target.value, 1);
                debounceFastRender();
            }
        }
    });

    container.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target && target.matches('[id^="dataset-right-"]')) {
            const index = parseInt(target.id.replace('dataset-right-', ''), 10);
            const dataset = initialData.datasets[index];
            if (dataset) {
                dataset.yAxisID = target.checked ? 'y1' : 'y';
                renderChart();
            }
        } else if (target && target.matches('[id^="dataset-visible-"]')) {
            const index = parseInt(target.id.replace('dataset-visible-', ''), 10);
            const dataset = initialData.datasets[index];
            if (dataset) {
                dataset.visible = target.checked;
                refreshSingleSeriesOptions();
                renderChart();
            }
        }
    });

    container.addEventListener('blur', (e) => {
        const target = e.target as HTMLTextAreaElement | HTMLInputElement;
        if (target && target.matches('[id^="dataset-data-"]')) {
            const index = parseInt(target.id.replace('dataset-data-', ''), 10);
            const dataset = initialData.datasets[index];
            if (dataset) {
                dataset.data = DataUtils.parseDatasetValues(target.value, initialData.labels.length);
                debounceFastRender();
            }
        }

        if (target && target.matches('[id^="dataset-name-"]')) {
            const index = parseInt(target.id.replace('dataset-name-', ''), 10);
            const dataset = initialData.datasets[index];
            if (dataset) {
                dataset.label = target.value;
                refreshSingleSeriesOptions();
                renderChart();
            }
        }
    }, true);
}

export function bindGlobalControls(): void {
    if (DOM.labelsInput) {
        DOM.labelsInput.addEventListener('blur', () => {
            const labels = DOM.labelsInput.value
                .split(/[,，]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
            if (labels.length > 0) {
                initialData.labels = labels;
                renderChart();
            }
        });
    }

    const singleSeriesSelect = document.getElementById('single-series-select');
    if (singleSeriesSelect) {
        singleSeriesSelect.addEventListener('change', renderChart);
    }

    DOM.xAxisTitle?.addEventListener('blur', renderChart);
    DOM.yAxisLeftTitle?.addEventListener('blur', renderChart);
    DOM.yAxisRightTitle?.addEventListener('blur', renderChart);

    if (DOM.donutCutout && DOM.donutCutoutValue) {
        const updateDonutSlider = () => {
            const value = Number(DOM.donutCutout!.value);
            const min = Number(DOM.donutCutout!.min) || 0;
            const max = Number(DOM.donutCutout!.max) || 100;
            const percentage = ((value - min) / (max - min)) * 100;
            DOM.donutCutout!.style.setProperty('--value', `${percentage}%`);
            DOM.donutCutoutValue!.textContent = String(value);
        };

        DOM.donutCutout.addEventListener('input', (e) => {
            DOM.donutCutoutValue!.textContent = (e.target as HTMLInputElement).value;
            updateDonutSlider();
            debounceFastRender();
        });
        updateDonutSlider();
    }

    if (DOM.pieRadius && DOM.pieRadiusValue) {
        const updatePieSlider = () => {
            const value = Number(DOM.pieRadius!.value);
            const min = Number(DOM.pieRadius!.min) || 0;
            const max = Number(DOM.pieRadius!.max) || 100;
            const percentage = ((value - min) / (max - min)) * 100;
            DOM.pieRadius!.style.setProperty('--value', `${percentage}%`);
            DOM.pieRadiusValue!.textContent = String(value);
        };

        DOM.pieRadius.addEventListener('input', (e) => {
            DOM.pieRadiusValue!.textContent = (e.target as HTMLInputElement).value;
            updatePieSlider();
            debounceFastRender();
        });
        updatePieSlider();
    }

    if (DOM.areaOpacity && DOM.areaOpacityValue) {
        const updateAreaSlider = () => {
            const value = Number(DOM.areaOpacity!.value);
            const min = Number(DOM.areaOpacity!.min) || 0;
            const max = Number(DOM.areaOpacity!.max) || 100;
            const percentage = ((value - min) / (max - min)) * 100;
            DOM.areaOpacity!.style.setProperty('--value', `${percentage}%`);
            DOM.areaOpacityValue!.textContent = String(value);
        };

        DOM.areaOpacity.addEventListener('input', (e) => {
            DOM.areaOpacityValue!.textContent = (e.target as HTMLInputElement).value;
            updateAreaSlider();
            debounceFastRender();
        });
        updateAreaSlider();
    }

    if (DOM.histBins && DOM.histBinsValue) {
        DOM.histBins.addEventListener('input', () => {
            DOM.histBinsValue!.textContent = DOM.histBins!.value;
            debounceFastRender();
        });
    }

    if (DOM.exportScale && DOM.exportScaleValue) {
        const updateExportSlider = () => {
            const value = Number(DOM.exportScale!.value);
            const min = Number(DOM.exportScale!.min) || 1;
            const max = Number(DOM.exportScale!.max) || 5;
            const percentage = ((value - min) / (max - min)) * 100;
            DOM.exportScale!.style.setProperty('--value', `${percentage}%`);
            DOM.exportScaleValue!.textContent = String(value);
        };

        DOM.exportScale.addEventListener('input', (e) => {
            DOM.exportScaleValue!.textContent = (e.target as HTMLInputElement).value;
            updateExportSlider();
        });
        updateExportSlider();
    }

    DOM.exportButton?.addEventListener('click', () => {
        const type = (DOM.exportType ? DOM.exportType.value : 'png') as ExportFormat;
        const scale = DOM.exportScale ? parseInt(DOM.exportScale.value || '1', 10) : 1;
        const bg = DOM.exportBg ? DOM.exportBg.value : '#FFFFFF';
        DOM.exportButton!.classList.add('exporting');
        setTimeout(() => DOM.exportButton!.classList.remove('exporting'), 1000);
        exportChartImage(type, scale, bg);
    });

    let isFirstRender = true;
    const triggerRender = () => renderChart();

    DOM.chartType.addEventListener('change', () => {
        const nextType = DOM.chartType.value as ChartType;
        if (isFirstRender) {
            isFirstRender = false;
            triggerRender();
            updateControlVisibility(nextType);
            if (nextType === 'bar-line') {
                buildMixedTypeSelectors();
            }
        } else {
            animateChartTransition(() => {
                triggerRender();
                updateControlVisibility(nextType);
                if (nextType === 'bar-line') {
                    buildMixedTypeSelectors();
                }
            });
        }
    });

    DOM.chartTitle.addEventListener('blur', triggerRender);
    DOM.paletteSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        applyPalette(target.value as PaletteKey);
        createDatasetControls();
        refreshSingleSeriesOptions();
        triggerRender();
    });

    DOM.exportBg.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const normalizedColor = ColorUtils.normalizeColorToHex(target.value);
        DOM.exportBg.value = normalizedColor;
        triggerRender();
    });

    DOM.addDataset.addEventListener('click', () => {
        const nextIndex = initialData.datasets.length;
        const palette = getColorPalette(currentPaletteKey);
        const color = palette[nextIndex % palette.length];
        const randomData = Array.from({ length: initialData.labels.length }, () => Math.max(0, Math.round(Math.random() * 20)));
        initialData.datasets.push({
            label: `对比量 ${nextIndex + 1}`,
            data: randomData,
            backgroundColor: ColorUtils.hexToRgba(color, 0.7),
            borderColor: ColorUtils.hexToRgba(color, 1),
            borderWidth: 2,
            type: 'bar',
            yAxisID: 'y',
            linePointStyle: 'circle',
            lineBorderWidth: 2,
            lineFill: false,
            visible: true
        });
        createDatasetControls();
        refreshSingleSeriesOptions();
        triggerRender();
    });

    DOM.removeDataset.addEventListener('click', () => {
        if (initialData.datasets.length > 1) {
            initialData.datasets.pop();
            createDatasetControls();
            refreshSingleSeriesOptions();
            triggerRender();
        } else {
            alert('至少需要保留一个对比量');
        }
    });

    DOM.resetDashboard.addEventListener('click', () => {
        restoreDefaults();
    });

    DOM.orientationVertical.addEventListener('click', () => {
        setOrientation('x');
        DOM.orientationVertical.classList.add('active');
        DOM.orientationHorizontal.classList.remove('active');
        triggerRender();
    });

    DOM.orientationHorizontal.addEventListener('click', () => {
        setOrientation('y');
        DOM.orientationHorizontal.classList.add('active');
        DOM.orientationVertical.classList.remove('active');
        triggerRender();
    });

    DOM.axisSwapBtn?.addEventListener('click', () => {
        if (DOM.xAxisTitle && DOM.yAxisLeftTitle) {
            const tmp = DOM.xAxisTitle.value;
            DOM.xAxisTitle.value = DOM.yAxisLeftTitle.value;
            DOM.yAxisLeftTitle.value = tmp;
            triggerRender();
        }
    });

    DOM.themeLight.addEventListener('click', applyLightTheme);
    DOM.themeDark.addEventListener('click', applyDarkTheme);

    if (DOM.bubbleUseCustomXY) {
        DOM.bubbleUseCustomXY.addEventListener('change', () => {
            const xyInputsDiv = document.getElementById('bubble-xy-inputs');
            if (xyInputsDiv) {
                xyInputsDiv.classList.toggle('hidden', !DOM.bubbleUseCustomXY!.checked);
            }
            triggerRender();
        });
    }

    DOM.bubbleXData?.addEventListener('blur', triggerRender);
    DOM.bubbleYData?.addEventListener('blur', triggerRender);
}
