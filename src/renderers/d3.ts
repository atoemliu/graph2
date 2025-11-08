import * as d3 from 'd3';
import { CHART_CONSTANTS, getColorPalette } from '../app.constants';
import { DOM, Elements, initialData, currentPaletteKey } from '../app.state';
import * as ColorUtils from '../utils/color';
import * as DOMUtils from '../utils/dom';
import { Theme } from '../utils/helpers';

function getSelectedSeriesLabel(): string | null {
    const singleSeriesSelect = document.getElementById('single-series-select') as HTMLSelectElement;
    let selectedIndex = 0;
    if (singleSeriesSelect && !singleSeriesSelect.disabled) {
        const candidate = parseInt(singleSeriesSelect.value || '0', 10);
        if (!Number.isNaN(candidate) && initialData.datasets[candidate]) {
            selectedIndex = candidate;
        }
    }
    const selectedDataset = initialData.datasets[selectedIndex];
    if (selectedDataset) {
        return selectedDataset.label || `对比量 ${selectedIndex + 1}`;
    }
    return null;
}

function getTitleWithSeries(): string {
    const baseTitle = DOM.chartTitle.value || '我的图表';
    const seriesLabel = getSelectedSeriesLabel();
    if (seriesLabel) {
        return `${baseTitle} - ${seriesLabel}`;
    }
    return baseTitle;
}

function renderEmptySVG(svg: SVGSVGElement, canvas: HTMLCanvasElement, title: string) {
    DOMUtils.prepareSVG(svg, canvas);
    const { width, height } = DOMUtils.sizeSVG(svg);
    DOMUtils.addSVGTitles(svg, title, width, height);
}

export function renderStreamgraph(): void {
    try {
        const svg = Elements?.svg;
        const canvas = Elements?.canvas;

        if (!svg || !canvas) {
            console.error('SVG或Canvas元素未找到');
            return;
        }

        DOMUtils.prepareSVG(svg, canvas);
        const { width, height } = DOMUtils.sizeSVG(svg);

        const margin = CHART_CONSTANTS.MARGINS.DEFAULT;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const visibleDatasets = initialData.datasets.filter(ds => ds.visible !== false);
        if (!visibleDatasets.length) {
            DOMUtils.addSVGTitles(svg, DOM.chartTitle.value, width, height);
            return;
        }

        const maxLength = Math.max(...visibleDatasets.map(ds => (ds.data || []).length));
        const labels = initialData.labels.slice(0, maxLength);

        const keys = visibleDatasets.map((ds, index) => ds.label || `系列 ${index + 1}`);
        const dataByIndex = labels.map((_, labelIndex) => {
            const entry: Record<string, number> = {};
            visibleDatasets.forEach((ds, dsIndex) => {
                const value = Number(ds.data[labelIndex] ?? 0);
                entry[keys[dsIndex]] = Number.isFinite(value) ? value : 0;
            });
            return entry;
        });

        const stack = d3.stack().keys(keys).offset(d3.stackOffsetWiggle);
        const series = stack(dataByIndex);

        const x = d3.scalePoint()
            .domain(labels)
            .range([0, chartWidth]);

        const yExtent: [number, number] = [
            d3.min(series, (s: any) => d3.min(s, (d: any) => d[0])) ?? 0,
            d3.max(series, (s: any) => d3.max(s, (d: any) => d[1])) ?? 0
        ];
        const y = d3.scaleLinear()
            .domain(yExtent)
            .nice()
            .range([chartHeight, 0]);

        const palette = getColorPalette(currentPaletteKey);
        const colorByKey = new Map<string, string>();
        visibleDatasets.forEach((ds, index) => {
            const base = typeof ds.backgroundColor === 'string'
                ? ColorUtils.ensureSolidColor(ds.backgroundColor, 0.85)
                : ColorUtils.hexToRgba(palette[index % palette.length], 0.85);
            colorByKey.set(keys[index], base);
        });

        const root = d3.select(svg)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const area = d3.area()
            .x((d: any, i: number) => x(labels[i]) ?? 0)
            .y0((d: any) => y(d[0]))
            .y1((d: any) => y(d[1]))
            .curve(d3.curveCatmullRom.alpha(CHART_CONSTANTS.D3.STREAMGRAPH_CURVE_ALPHA));

        root.selectAll('path.layer')
            .data(series)
            .enter()
            .append('path')
            .attr('class', 'layer')
            .attr('d', (d: any) => area(d))
            .attr('fill', (_: unknown, index: number) => colorByKey.get(keys[index]) || ColorUtils.hexToRgba('#4ECDC4', 1.0))
            .attr('opacity', CHART_CONSTANTS.D3.STREAMGRAPH_OPACITY)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);

        const axis = d3.axisBottom(x).tickSize(0).tickPadding(12);
        const axisElement = root.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(axis as any);

        const textColor = Theme.getThemeTextColor();
        axisElement.selectAll('text').attr('fill', textColor);
        axisElement.selectAll('path').attr('stroke', Theme.getThemeGridColor());

        const legendGroup = d3.select(svg)
            .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width / 2}, ${height - 35})`);

        const legendItemWidth = 120;
        const legendRectSize = 16;
        const legendSpacing = 8;

        const totalWidth = keys.length * legendItemWidth;
        const startX = -totalWidth / 2;

        keys.forEach((key, index) => {
            const legendItem = legendGroup.append('g')
                .attr('transform', `translate(${startX + index * legendItemWidth}, 0)`);

            legendItem.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .attr('fill', colorByKey.get(key) || '#999')
                .attr('rx', 3)
                .attr('ry', 3);

            legendItem.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize / 2)
                .attr('dy', '0.35em')
                .attr('fill', textColor)
                .attr('font-size', '13')
                .attr('font-weight', '500')
                .text(key);
        });

        DOMUtils.addSVGTitles(svg, DOM.chartTitle.value, width, height);
    } catch (error) {
        console.error('渲染流图失败:', error);
        const svg = Elements?.svg;
        if (svg && Elements?.canvas) {
            renderEmptySVG(svg, Elements.canvas, '渲染错误');
        }
    }
}

export function renderTreemap(): void {
    try {
        const svg = Elements?.svg;
        const canvas = Elements?.canvas;

        if (!svg || !canvas) {
            console.error('SVG或Canvas元素未找到');
            return;
        }

        DOMUtils.prepareSVG(svg, canvas);
        const { width, height } = DOMUtils.sizeSVG(svg);

        const margin = CHART_CONSTANTS.MARGINS.COMPACT;
        const innerPadding = 32;
        const chartWidth = width - margin.left - margin.right - innerPadding;
        const chartHeight = height - margin.top - margin.bottom - innerPadding;
        const offsetX = margin.left + innerPadding / 2;
        const offsetY = margin.top + innerPadding / 2;

        const selectedIndex = (() => {
            const singleSeriesSelect = document.getElementById('single-series-select') as HTMLSelectElement | null;
            if (singleSeriesSelect && !singleSeriesSelect.disabled) {
                const idx = parseInt(singleSeriesSelect.value || '0', 10);
                if (!Number.isNaN(idx) && initialData.datasets[idx]) {
                    return idx;
                }
            }
            return 0;
        })();

        const selectedDataset = initialData.datasets[selectedIndex];
        if (!selectedDataset) {
            return;
        }

        const validValues = (selectedDataset.data || []).filter((v: unknown) => typeof v === 'number') as number[];
        const labels = initialData.labels.slice(0, validValues.length);

        const treemapData = {
            name: selectedDataset.label || `系列 ${selectedIndex + 1}`,
            children: labels.map((label, i) => ({
                name: label,
                value: validValues[i] ?? 0
            }))
        };

        const root = d3.hierarchy(treemapData)
            .sum((d: any) => d.value)
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

        d3.treemap()
            .size([chartWidth, chartHeight])
            .padding(CHART_CONSTANTS.D3.TREEMAP_PADDING)
            .round(true)(root);

        const baseHex = ColorUtils.rgbaToHex(selectedDataset.backgroundColor) || '#4ECDC4';
        const color = d3.scaleLinear<string, string>()
            .domain([0, d3.max(validValues) || 1])
            .range([d3.color(baseHex)!.brighter(1.5).formatHex(), d3.color(baseHex)!.darker(0.5).formatHex()]);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${offsetX},${offsetY})`);
        svg.appendChild(g);

        root.leaves().forEach((leaf: any, index: number) => {
            const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            node.setAttribute('class', 'node');
            node.setAttribute('transform', `translate(${leaf.x0},${leaf.y0})`);

            const rectWidth = Math.max(0, leaf.x1 - leaf.x0);
            const rectHeight = Math.max(0, leaf.y1 - leaf.y0);

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', String(rectWidth));
            rect.setAttribute('height', String(rectHeight));
            rect.setAttribute('fill', color(validValues[index] || 0));
            rect.setAttribute('stroke', '#fff');
            rect.setAttribute('stroke-width', '2.5');
            rect.setAttribute('rx', '6');
            rect.setAttribute('ry', '6');
            node.appendChild(rect);

            if (rectWidth >= CHART_CONSTANTS.UI.MIN_RECT_WIDTH_FOR_TEXT && rectHeight >= CHART_CONSTANTS.UI.MIN_RECT_HEIGHT_FOR_TEXT) {
                const areaRatio = (rectWidth * rectHeight) / (width * height);
                const fontSize = Math.round(CHART_CONSTANTS.FONT_SIZES.TREEMAP_MIN +
                    (CHART_CONSTANTS.FONT_SIZES.TREEMAP_MAX - CHART_CONSTANTS.FONT_SIZES.TREEMAP_MIN) * Math.sqrt(areaRatio));

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.textContent = `${labels[index]}: ${validValues[index]}`;
                text.setAttribute('x', String(rectWidth / 2));
                text.setAttribute('y', String(rectHeight / 2));
                text.setAttribute('fill', Theme.getThemeTextColor());
                text.setAttribute('font-size', String(fontSize));
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                node.appendChild(text);
            }

            g.appendChild(node);
        });

        DOMUtils.addSVGTitles(svg, getTitleWithSeries(), width, height);
    } catch (error) {
        console.error('渲染树图失败:', error);
        const svg = Elements?.svg;
        if (svg && Elements?.canvas) {
            renderEmptySVG(svg, Elements.canvas, '渲染错误');
        }
    }
}
