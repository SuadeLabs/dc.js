import {scaleLinear} from 'd3-scale';

import {CompositeChart} from './composite-chart';
import {transition} from '../core/core';

export class CompositeMultiAxisChart extends CompositeChart {
    constructor (parent, chartGroup) {
        super(parent, chartGroup);

        // this.bar
        this._customRanges = [];
        this._barIdentifierPositions = {}
        this._lowestYMin = undefined;
    }

    _calculateYAxisRanges () {
        this._children.forEach((child, index) => {
            if (typeof child._useCustomYRange !== 'string') {
                const min = Math.min(...child._useCustomYRange);

                if (index === 0 || min < this._lowestYMin) {
                    this._lowestYMin = min;
                }
            }

            this._customRanges[child._groupName] = {range: child._useCustomYRange};
        });
    }

    _prepareYAxis () {
        this._calculateYAxisRanges();

        this._children.forEach((child, index) => {
            let range = child._useCustomYRange;

            if (typeof child._useCustomYRange === 'string') {
                range = this._customRanges[child._useCustomYRange].range;
            }

            let domain = [0, range[1]];

            if (this._lowestYMin < 0) {
                const yMax = Math.max(...[Math.abs(range[0]), Math.abs(range[1])])

                // Need to use yMax value to align 0 across all axes when there are negative values
                domain = [-yMax, yMax];
                console.log('domain', domain)
            }

            if (child.useRightYAxis()) {
                this.rightY(scaleLinear()
                  .domain(domain)
                  .rangeRound([this.yAxisHeight(), 0])
                  .nice()
                );

                this._customRanges[child._groupName].y = this.rightY();
            } else {
                this.y(scaleLinear()
                  .domain(domain)
                  .rangeRound([this.yAxisHeight(), 0])
                  .nice()
                );

                this._customRanges[child._groupName].y = this.y();
            }
        })
    }

    _drawBarIdentifier (child, index) {
        const yName = child._groupName.split(' ').join('').toLowerCase();

        child.g()
        .append('circle')
        .attr('id', `${yName}-identifier`)
        .attr('fill', child.getColor(index))
        .attr('cx', 0)
        .attr('cy', 20)
        .attr('r', 5)

        console.log('>>>> child._groupName', child._groupName);
        console.log('>>>> child.getColor(i)', child.getColor(index));
    }

    plotData () {
        console.log('>>>> this.svg()', this.svg());
        for (let i = 0; i < this._children.length; ++i) {
            const child = this._children[i];

            console.log('>>>> child', child);

            if (!child.g()) {
                this._generateChildG(child, i);
            }

            if (this._shareColors) {
                child.colors(this.colors());
            }

            child.x(this.x());
            child.xAxis(this.xAxis());

            console.log('>>>> this._customRanges[child._groupName].y', this._customRanges[child._groupName].y);

            child.y(this._customRanges[child._groupName].y);
            child.yAxis(this.yAxis().scale(this._customRanges[child._groupName].y))

            child.plotData();

            this._drawBarIdentifier(child, i);

            child._activateRenderlets();
        }
    }

    renderXAxis (g) {
        super.renderXAxis(g);

        if (this._lowestYMin < 0) {
            const axisXG = g.select('g.x');

            transition(axisXG, this.transitionDuration(), this.transitionDelay())
                .attr('transform', `translate(${this.margins().left}, ${this.height() - this.margins().bottom - this._y(0)})`)
                .call(this._xAxis);
        }
    }

    renderYAxis () {
        this._leftYAxisChildren().forEach((child, index) => {
            this._createLeftYAxis(child, index);
        });

        this._rightYAxisChildren().forEach((child, index) => {
            this._createRightYAxis(child, index);
        });
    }

    _updateBarIdentifierXPos (groupName, yAxisOffset) {
        const yName = groupName.split(' ').join('').toLowerCase();

        this.svg()
        .select(`#${yName}-identifier`)
        .attr('cx', yAxisOffset);
    }

    _createLeftYAxis (child,index) {
        if (typeof child._useCustomYRange !== 'string') {
            const yOffset = this.margins().left - index * (this.margins().left / this._leftYAxisChildren().length);

            this._updateBarIdentifierXPos(child._groupName, yOffset - 3);
            this._barIdentifierPositions[child._groupName] = yOffset - 3;

            this.renderYAxisAt(
                `y${index}`,
                this.yAxis().scale(this._customRanges[child._groupName].y),
                yOffset
            );

            this.renderYAxisLabel(`y${index}`, this.yAxisLabel(), -90);
        } else {
            this._updateBarIdentifierXPos(child._groupName, this._barIdentifierPositions[child._useCustomYRange] - 12)
        }
    }

    _createRightYAxis (child, index) {
        if (typeof child._useCustomYRange !== 'string') {
            const yrOffset = this.width() - this.margins().right + index * (this.margins().right / this._rightYAxisChildren().length);

            this._updateBarIdentifierXPos(child._groupName, yrOffset);
            this._barIdentifierPositions[child._groupName] = yrOffset;

            this.renderYAxisAt(
                `yr${index}`,
                this.rightYAxis().scale(this._customRanges[child._groupName].y),
                yrOffset
            );

            this.renderYAxisLabel(`yr${index}`, this.rightYAxisLabel(), 90, this.width() - this._rightYAxisLabelPadding);
        } else {
            this._updateBarIdentifierXPos(child._groupName, this._barIdentifierPositions[child._useCustomYRange] + 12)
        }
    }
}

export const compositeMultiAxisChart = (parent, chartGroup) => new CompositeMultiAxisChart(parent, chartGroup);