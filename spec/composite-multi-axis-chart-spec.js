/* global appendChartID, loadMultiYAxisData, loadMultiYChartData */

let id;
let chart = null;
let crossFilters = [];
let processedData = [];
let barCharts = [];

describe('dc.compositeMultiAxisChart', () => {

    const buildBarCharts = items => {

        let useRight = true
        items.forEach((barChart, index) => {
            const chartItem = new dc.BarChart(chart)
                                    .dimension(processedData[index].dataDimension)
                                    .group(processedData[index].dataIdSumGroup)
                                    .centerBar(true)
                                    .group(processedData[index].dataValueSumGroup, barChart.name || ` ${index}`)
                                    .gap(1)
                                    .useCustomYRange(barChart.yAxis.useRange)
                                    .useRightYAxis(useRight)

            useRight = !useRight; // alternate between left and right y axis
            barCharts.push(chartItem);
        })
    }

    beforeEach(() => {
        chart = null;
        barCharts = [];
        processedData = [];
        crossFilters = loadMultiYAxisData().map(item => crossfilter(item));

        processedData = crossFilters.map(data => {
            const dimension = data.dimension(d => d.key);
            return {
                dataDimension: dimension,
                dataValueSumGroup: dimension.group().reduceSum(d => d.value),
                dataValueNegativeSumGroup: dimension.group().reduceSum(d => -d.value),
                dataIdSumGroup: dimension.group().reduceSum(d => d.key),
                dataIdNegativeSumGroup: dimension.group().reduceSum(d => -d.key),
                dataGroup: dimension.group(),
            }
        });

        id = 'composite-multi-axis-chart';
        appendChartID(id);

        chart = new dc.CompositeMultiAxisChart(`#${id}`);

        buildBarCharts(loadMultiYChartData(), processedData);

        chart
          .width(500)
          .height(200)
          .x(d3.scaleBand().domain(processedData[0].dataIdSumGroup.all().map(v => v.key)))
          .xUnits(dc.units.ordinal)
          .transitionDuration(500)
          .shareColors(true)
          .compose(barCharts);
    });

    it('should register the chart with DC', () => {
        expect(dc.hasChart(chart)).toBeTruthy();
    });

    // it('should set a dimension on the chart', () => {
    // barCharts.forEach((barChart, index) => {
    //     expect(barChart.dimension()).toBe(processedData[index].dataDimension);
    // });
    // });

    // it('should set a group on the chart', () => {
    //     barCharts.forEach((barChart, index) => {
    //         expect(barChart.group()).toBe(processedData[index].dataIdSumGroup);
    //     });
    // });

    it('should set a width on the chart', () => {
        expect(chart.width()).toBe(500);

        chart.children().forEach(child => {
            expect(child.width()).toBe(500);
        });
    });

    it('should set a height on the chart', () => {
        expect(chart.height()).toBe(200);

        chart.children().forEach(child => {
            expect(child.height()).toBe(200);
        });
    });

    it('should have zero transition duration', () => {
        expect(chart.transitionDuration()).toBe(500);
    });

    it('should set the margins of the chart', () => {
        expect(chart.margins()).not.toBeNull();

        chart.children().forEach(child => {
            expect(child.margins()).toBe(chart.margins());
        });
    });

    it('should set a domain', () => {
        expect(chart.x()).toBeDefined();
    });

    it('should set the x domain to endpoint dates', () => {
        expect(chart.x().domain()[0]).toBe('testItem1');
        expect(chart.x().domain()[1]).toBe('testItem2');
        expect(chart.x().domain()[2]).toBe('testItem3');
    });

    it('should set the x units', () => {
        expect(chart.xUnits()).toBe(dc.units.ordinal);
    });

    it('should create the x axis', () => {
        expect(chart.xAxis()).not.toBeNull();
    });

    it('should create the y axis', () => {
        expect(chart.yAxis()).not.toBeNull();
    });

    it('should create the brush', () => {
        expect(chart.select('g.brush')).not.toBeNull();
    });

    it('does not set round by default', () => {
        expect(chart.round()).not.toBeDefined();
    });

    it('can change round', () => {
        chart.round(d3.utcDay.round);
        expect(chart.round()).not.toBeNull();
    });

    it('has a default value for x', () => {
        expect(chart.keyAccessor()).not.toBeNull();
    });

    it('has a default value for y', () => {
        expect(chart.valueAccessor()).not.toBeNull();
    });

    it('should not allow calling yAxisMin', () => {
        expect(chart.yAxisMin).toThrowError();
    });

    it('should not allow calling yAxisMax', () => {
        expect(chart.yAxisMax).toThrowError();
    });

    describe('rendering the chart', () => {
        beforeEach(() => {
            chart.render();
        });

        it('should create a root SVG element', () => {
            expect(chart.svg().empty()).toBeFalsy();
        });

        it('should create a root SVG group element', () => {
            expect(chart.g().empty()).toBeFalsy();
        });

        it('should create one x axis', () => {
            const axisNodes = chart.selectAll('g.axis.x').nodes();

            expect(axisNodes.length).toBe(1);
        });

        it('should create a multiple y Axes', () => {
            const axisNodes = chart.selectAll('g.axis').nodes();

            expect(axisNodes.length).toBe(6);

            // node 0 is always the x axis
            expect(d3.select(axisNodes[1]).attr('class')).toBe('axis y0');
            expect(d3.select(axisNodes[2]).attr('class')).toBe('axis y1');
            expect(d3.select(axisNodes[3]).attr('class')).toBe('axis y2');
            expect(d3.select(axisNodes[4]).attr('class')).toBe('axis yr0');
            expect(d3.select(axisNodes[5]).attr('class')).toBe('axis yr1');
        });

        it('should size the chart to the full height of the chart', () => {
            expect(chart.select('svg').attr('height')).toBe('200');
        });

        it('should set x range to width', () => {
            expect(chart.x().range()).toEqual([0, 420]);
        });

        it('should set y domain', () => {
            expect(chart.y()).toBeDefined();
        });

        it('should set y range to height by default', () => {
            expect(chart.y().range()).toEqual([160, 0]);
        });

        // it('should automatically size the y domain based on height', () => {
        //     expect(chart.y().domain()).toEqual([0, 281]);
        // });

        // it('should place the x axis at the bottom', () => {
        //     expect(chart.select('svg g g.x').attr('transform')).toMatchTranslate(30, 120);
        // });

        it('should create a separate g for each subchart', () => {
            expect(chart.selectAll('g.sub').size()).toBe(7);
        });

        it('should index each subchart g by css class', () => {
            expect(d3.select(chart.selectAll('g.sub').nodes()[0]).attr('class')).toBe('sub _0');
            expect(d3.select(chart.selectAll('g.sub').nodes()[1]).attr('class')).toBe('sub _1');
            expect(d3.select(chart.selectAll('g.sub').nodes()[2]).attr('class')).toBe('sub _2');
            expect(d3.select(chart.selectAll('g.sub').nodes()[3]).attr('class')).toBe('sub _3');
            expect(d3.select(chart.selectAll('g.sub').nodes()[4]).attr('class')).toBe('sub _4');
            expect(d3.select(chart.selectAll('g.sub').nodes()[5]).attr('class')).toBe('sub _5');
            expect(d3.select(chart.selectAll('g.sub').nodes()[6]).attr('class')).toBe('sub _6');
        });

        it('should generate 21 sub bar charts', () => {
            expect(chart.selectAll('g.sub g._0 rect').size()).toBe(21);
        });

        // it('should render sub bar chart', () => {
        //     expect(chart.selectAll('g.sub rect.bar').size()).not.toBe(0);

        //     // console.log(chart.selectAll('svg').html());

        //     chart.selectAll('g.sub rect.bar').each(function (d, i) {

        //         console.log('this',this);
        //         console.log('d3.select(this)',d3.select(this).html());

        //         // console.log('>>>> rect.bar y', d3.select(this).attr('y'));
        //         // console.log('>>>> rect.bar height', d3.select(this).attr('height'));

        //         switch (i) {
        //             case 0:
        //                 expect(d3.select(this).attr('x')).toBeCloseTo('22.637931034482758', 3);
        //                 expect(d3.select(this).attr('y')).toBe('93');
        //                 expect(d3.select(this).attr('width')).toBe('3');
        //                 expect(d3.select(this).attr('height')).toBe('17');
        //                 break;
        //             case 5:
        //                 expect(d3.select(this).attr('x')).toBeCloseTo('394.3620689655172', 3);
        //                 expect(d3.select(this).attr('y')).toBe('80');
        //                 expect(d3.select(this).attr('width')).toBe('3');
        //                 expect(d3.select(this).attr('height')).toBe('30');
        //                 break;
        //         }
        //     });
        // });

        describe('the chart clip paths', () => {
            it('should create only one defs', () => {
                expect(chart.selectAll('defs').size()).toBe(1);
            });

            it('should create only one clip path', () => {
                expect(chart.selectAll('defs #composite-multi-axis-chart-clip').size()).toBe(1);
            });

            it('should have the correct size', () => {
                const rect = chart.select('defs #composite-multi-axis-chart-clip rect');
                expect(rect.attr('width')).toBe('420');
                expect(rect.attr('height')).toBe('160');
            });

            it('should have clip path refs', () => {
                expect(chart.selectAll('g.chart-body').size()).not.toBe(0);
                chart.selectAll('g.chart-body').each(function () {
                    expect(d3.select(this).attr('clip-path')).toMatchUrl(`${window.location.href}#composite-multi-axis-chart-clip`);
                });
            });
        });
    });

    // describe('no elastic', () => {
    //     beforeEach(() => {
    //         chart.y(d3.scaleLinear().domain([-200, 200]));
    //         chart.render();
    //     });

    //     it('should respect manually applied domain', () => {
    //         // console.log('>>>> chart', chart.selectAll('svg').html());
    //         expect(chart.y().domain()[0]).toBe(-200);
    //         expect(chart.y().domain()[1]).toBe(200);
    //     });
    // });

    // describe('elastic chart axes', () => {
    //     beforeEach(() => {
    //         data.dimension(d => d.countrycode).filter('CA');

    //         chart.elasticY(true).elasticX(true).render();
    //     });

    //     it('should adjust the y axis, combining all child charts maxs & mins', () => {
    //         expect(chart.y().domain()[1]).toBe(115);
    //     });

    //     it('should set the x domain', () => {
    //         expect(chart.x().domain()[0].getTime() >= 1337904000000).toBeTruthy();
    //         expect(chart.x().domain()[1].getTime() >= 1344556800000).toBeTruthy();
    //     });
    // });

    // describe('subchart title rendering', () => {
    //     beforeEach(() => {
    //         chart.renderTitle(false);
    //         chart.render();
    //     });

    //     it('should respect boolean flag when title not set', () => {
    //         expect(chart.select('.sub._0 .dc-tooltip._0 .dot').empty()).toBeTruthy();
    //         expect(chart.select('.sub._1 .dc-tooltip._0 .dot').empty()).toBeTruthy();
    //     });
    // });

    // describe('the y-axes', () => {
    // describe('when composing charts with both left and right y-axes', () => {
    // let rightChart;

    // beforeEach(() => {
    //     chart
    //       .compose([
    //           new dc.BarChart(chart)
    //               .group(dataValueSumGroup, 'Date Value Group'),
    //           rightChart = new dc.LineChart(chart)
    //               .group(dataIdSumGroup, 'Date ID Group')
    //               .stack(dataValueSumGroup, 'Date Value Group')
    //               .stack(dataValueSumGroup, 'Date Value Group')
    //               .useRightYAxis(true)
    //       ])
    //       .render();
    // });

    // it('should render two y-axes', () => {
    //     expect(chart.selectAll('.axis').size()).toBe(3);
    // });

    // it('should render a right and a left label', () => {
    //     chart.yAxisLabel('Left Label').rightYAxisLabel('Right Label').render();

    //     expect(chart.selectAll('.y-axis-label').size()).toBe(2);
    //     expect(chart.selectAll('.y-axis-label.y-label').empty()).toBeFalsy();
    //     expect(chart.selectAll('.y-axis-label.yr-label').empty()).toBeFalsy();
    // });

    // it('should scale "right" charts according to the right y-axis' , () => {
    //     expect(rightChart.y()).toBe(chart.rightY());
    // });

    // it('should set the domain of the right axis', () => {
    //     expect(rightChart.yAxisMin()).toBe(0);
    //     expect(rightChart.yAxisMax()).toBe(281);
    // });

    // it('domain', () => {
    //     expect(chart.rightY().domain()).toEqual([0, 281]);
    //     expect(chart.y().domain()).toEqual([0, 132]);
    // });

    // it('should set "right" chart y-axes to the composite chart right y-axis', () => {
    //     expect(rightChart.yAxis()).toBe(chart.rightYAxis());
    // });

    // describe('horizontal gridlines', () => {
    //     beforeEach(() => {
    //         chart.yAxis().ticks(3);
    //         chart.rightYAxis().ticks(6);
    //         chart.renderHorizontalGridLines(true).render();
    //     });

    //     it('should draw left horizontal gridlines by default', () => {
    //         expect(chart.selectAll('.grid-line.horizontal line').size()).toBe(3);
    //     });

    //     it('should allow right horizontal gridlines to be used', () => {
    //         chart.useRightAxisGridLines(true).render();
    //         expect(chart.selectAll('.grid-line.horizontal line').size()).toBe(6);
    //     });
    // });
    // });

    // describe('when composing left and right axes charts with negative values', () => {
    //     let leftChart, rightChart;
    //     beforeEach(() => {
    //         chart
    //           .compose([
    //               leftChart = new dc.BarChart(chart)
    //                   .group(dataIdNegativeSumGroup, 'Date ID Group'),
    //               rightChart = new dc.LineChart(chart)
    //                   .group(dataValueNegativeSumGroup, 'Date Value Group')
    //                   .useRightYAxis(true)
    //           ])
    //           .render();
    //     });

    //     it('the axis baselines should match', () => {
    //         /* because elasticY ensures zero is included for all-negatives, due to PR #1156 */
    //         expect(leftChart.y()(0)).toEqual(rightChart.y()(0));
    //     });

    //     describe('with alignYAxes', () => {
    //         beforeEach(() => {
    //             chart.alignYAxes(true)
    //               .elasticY(true)
    //               .render();
    //         });
    //         it('the axis baselines should match', () => {
    //             expect(leftChart.y()(0)).toEqual(rightChart.y()(0));
    //         });
    //         it('the series heights should be equal', () => {
    //             expect(plotHeight(leftChart)).toEqual(plotHeight(rightChart));
    //         });
    //     });
    // });
    // function plotHeight (_chart) {
    //     return _chart.y()(_chart.yAxisMax()) - _chart.y()(_chart.yAxisMin());
    // }
    // });

    // describe('composite property', () => {
    //     let originalMargins;
    //     beforeEach(() => {
    //         originalMargins = chart.margins();

    //         chart.width(1000);
    //         chart.height(500);
    //         chart.margins({top: 100, right: 100, bottom: 100, left: 100});
    //     });

    //     it('should set width on child charts', () => {
    //         expect(chart.width()).toBe(1000);

    //         chart.children().forEach(child => {
    //             expect(child.width()).toBe(1000);
    //         });
    //     });

    //     it('should set height on child charts', () => {
    //         expect(chart.height()).toBe(500);

    //         chart.children().forEach(child => {
    //             expect(child.height()).toBe(500);
    //         });
    //     });

    //     it('should set margins of child charts', () => {
    //         expect(chart.margins()).not.toBeNull();
    //         expect(chart.margins()).not.toBe(originalMargins);

    //         chart.children().forEach(child => {
    //             expect(child.margins()).toBe(chart.margins());
    //         });
    //     });
    // });
});
