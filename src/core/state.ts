import {
    cloneState,
    defaultState,
    initialData,
    DOM,
    Elements,
    setOrientation,
    setCurrentPaletteKey
} from '../app.state';
import { prepareCanvas } from '../utils/dom';
import { refreshSingleSeriesOptions, updateControlVisibility } from '../ui/visibility';
import { createDatasetControls } from '../ui/controls';
import { applyPalette, renderChart } from '../renderers/chartjs';

export function restoreDefaults(): void {
    const fresh = cloneState(defaultState);
    initialData.labels = fresh.labels;
    initialData.datasets.length = 0;
    fresh.datasets.forEach(ds => initialData.datasets.push(ds));

    DOM.chartType.value = 'bar';
    DOM.chartTitle.value = '我的图表';
    DOM.labelsInput.value = fresh.labels.join(', ');
    DOM.paletteSelect.value = 'bright';
    DOM.exportType.value = 'png';
    DOM.exportScale.value = '2';
    DOM.exportScaleValue.textContent = '2';
    DOM.exportBg.value = '#FFFFFF';

    if (DOM.xAxisTitle) DOM.xAxisTitle.value = '';
    if (DOM.yAxisLeftTitle) DOM.yAxisLeftTitle.value = '';
    if (DOM.yAxisRightTitle) DOM.yAxisRightTitle.value = '';

    DOM.donutCutout.value = '50';
    DOM.donutCutoutValue.textContent = '50';
    DOM.pieRadius.value = '65';
    DOM.pieRadiusValue.textContent = '65';
    DOM.areaOpacity.value = '35';
    DOM.areaOpacityValue.textContent = '35';
    DOM.histBins.value = '10';
    DOM.histBinsValue.textContent = '10';

    DOM.orientationVertical.classList.add('active');
    DOM.orientationHorizontal.classList.remove('active');
    setOrientation('x');

    DOM.themeLight.classList.add('active');
    DOM.themeDark.classList.remove('active');
    document.documentElement.setAttribute('data-theme', 'light');

    setCurrentPaletteKey('bright');
    prepareCanvas(Elements.svg, Elements.canvas);

    refreshSingleSeriesOptions();
    createDatasetControls();
    updateControlVisibility('bar');
    applyPalette('bright');
    renderChart();
}
