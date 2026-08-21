/* global appendChartID, loadMultiYAxisData, loadMultiYChartData */

// Tests based on the "Multiple y-axis" example (web-src/examples/composite-multiple-y-axis.html),
// which composes several dc.barChart instances onto a single dc.compositeMultiAxisChart.
// Each series gets its own y-axis domain (which may be shared with another series by
// name, e.g. 'AxisTest5' shares 'AxisTest3'), is coloured by key, and is centered/gapped
// as bar charts within the same category, alternating between the left and right y-axis.

describe('dc.compositeMultiAxisChart (multiple y-axes example)', () => {
    let id;
    let chart;
    let barCharts;
    let chartData;
    let crossFilterData;

    const DEFAULT_COLOURS = [
        '#1f78b480',
        '#e31a1c80',
        '#33a02c80',
        '#ff7f0080',
        '#6a3d9a80'
    ];

    // Mirrors `buildChart` in web-src/examples/multiple-y-axes.html: builds a bar
    // chart for a single data series, applying its own y-axis domain (which may
    // reference another series' domain by name) and colouring/gap/centering the
    // bars exactly as the example does.
    const buildChart = (data, index) => {
        const {dataDimension, dataValueSumGroup} = crossFilterData[index];
        const y = d3.scaleLinear();

        return dc.barChart(chart)
            .gap(1)
            .dimension(dataDimension)
            .group(dataValueSumGroup, data.name || `${index}`)
            .centerBar(true)
            .colorAccessor(d => d.key)
            .ordinalColors([DEFAULT_COLOURS[index % DEFAULT_COLOURS.length]])
            .multiYAxisDomainData(y, data.yAxis.domain)
            .useRightYAxis(index % 2 !== 0);
    };

    beforeEach(() => {
        id = 'composite-multiple-y-axis-chart';
        appendChartID(id);

        chartData = loadMultiYChartData();
        crossFilterData = loadMultiYAxisData().map(item => {
            const data = crossfilter(item);
            const dimension = data.dimension(d => d.key);

            return {
                dataDimension: dimension,
                dataValueSumGroup: dimension.group().reduceSum(d => d.value)
            };
        });

        chart = dc.compositeMultiAxisChart(`#${id}`);
        barCharts = chartData.map((data, index) => buildChart(data, index));

        chart.compose(barCharts)._rangeBandPadding(1);

        chart
            .width(500)
            .height(200)
            .transitionDuration(0)
            .x(d3.scaleBand().domain(crossFilterData[0].dataDimension.group().all().map(v => v.key)))
            .xUnits(dc.units.ordinal)
            .yAxisLabel(chartData[0].yAxis.label)
            .brushOn(false)
            .shareColors(true)
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(false)
            .margins({top: 40, left: 100, right: 100, bottom: 60});
    });

    it('should register the chart with DC', () => {
        expect(dc.hasChart(chart)).toBeTruthy();
    });

    it('should compose one bar chart per data series', () => {
        expect(chart.children().length).toBe(chartData.length);
    });

    it('should configure every child as a centered, single pixel gapped bar chart, per the example', () => {
        chart.children().forEach(child => {
            expect(child.centerBar()).toBeTruthy();
            expect(child.gap()).toBe(1);
        });
    });

    it('should not enable the brush, per the example', () => {
        expect(chart.brushOn()).toBeFalsy();
    });

    it('should render horizontal but not vertical gridlines, per the example', () => {
        expect(chart.renderHorizontalGridLines()).toBeTruthy();
        expect(chart.renderVerticalGridLines()).toBeFalsy();
    });

    it('should colour bars by their key so grouped values are individually coloured', () => {
        chart.children().forEach(child => {
            expect(child.colorAccessor()({key: 'bonds', value: 1})).toBe('bonds');
        });
    });

    it('should alternate charts between the left and right y-axis', () => {
        chart.children().forEach((child, index) => {
            expect(child.useRightYAxis()).toBe(index % 2 !== 0);
        });
    });

    it('should give each child its own y-axis domain, unless it references another series', () => {
        chart.children().forEach((child, index) => {
            expect(child._yDomain).toBe(chartData[index].yAxis.domain);
        });
    });

    describe('rendering the chart', () => {
        beforeEach(() => {
            chart.render();
        });

        it('should create a root SVG element', () => {
            expect(chart.svg().empty()).toBeFalsy();
        });

        it('should create a separate g for each bar chart series', () => {
            expect(chart.selectAll('g.sub').size()).toBe(chartData.length);
        });

        it('should create one y-axis per unique domain, sharing an axis for series that ' +
           "reference another series's domain by name", () => {
            // AxisTest5 shares AxisTest3's domain, and AxisTest7 shares AxisTest4's domain,
            // so those two series should not get their own axis.
            const uniqueDomainCount = chartData.filter(data => typeof data.yAxis.domain !== 'string').length;
            const axisNodes = chart.selectAll('g.axis').nodes();

            // -1 accounts for the x axis, which is always the first '.axis' node
            expect(axisNodes.length - 1).toBe(uniqueDomainCount);
        });

        it('should add one legend entry per series', () => {
            chart.legend(dc.legend()).render();

            expect(chart.selectAll('g.dc-legend-item').size()).toBe(chartData.length);
        });

        it('should not expose a defined() accessor, since the example only guards against ' +
           "it existing on line charts (`if (chart.defined) { ... }`) and all series here are bars", () => {
            expect(chart.defined).toBeUndefined();
        });

        describe('grouping bars from multiple series visually (as done by the pretransition.svg renderlet)', () => {
            it('should expose one .sub group per series so each can be clipped into its own slice', () => {
                const subs = chart.selectAll('.sub');

                expect(subs.size()).toBe(chartData.length);
            });

            it('should be able to divide the group width into a non-overlapping slice per series', () => {
                // Reproduces the clip-path slice calculation from handleUpdatesAfterRender()
                // in the example, ensuring every sub-chart can be assigned its own
                // non-overlapping horizontal band within the grouped bars.
                const subs = chart.selectAll('.sub');
                const subScale = d3.scaleLinear().domain([0, subs.size()]).range([0, 100]);

                subs.each(function (d, i) {
                    const startAt = subScale(i + 1) - subScale(1);
                    const endAt = subScale(i + 1);

                    expect(endAt).toBeGreaterThan(startAt);
                });
            });
        });
    });
});
