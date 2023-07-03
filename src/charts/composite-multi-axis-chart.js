import {CompositeChart} from './composite-chart';
import {transition} from '../core/core';
import {scaleLinear} from 'd3-scale';

export class CompositeMultiAxisChart extends CompositeChart {
    constructor (parent, chartGroup) {
        super(parent, chartGroup);

        this._yScaleArray = [];
        this._markerPositions = {}
        this._centerXAxis = false;
    }

    _calculateYAxisRanges (left, right) {

        let lyAxisMin, lyAxisMax, ryAxisMin, ryAxisMax;

        if (left) {
            lyAxisMin = this._yAxisMin();
            lyAxisMax = this._yAxisMax();
        }

        if (right) {
            ryAxisMin = this._rightYAxisMin();
            ryAxisMax = this._rightYAxisMax();
        }


        this._children.forEach(child => {
            if (!child._yDomain) {
                child._yDomain = left ? [lyAxisMin, lyAxisMax] : [ryAxisMin, ryAxisMax];
            }
            if (child._yDomain[0] < 0) {
                this._centerXAxis = true;
            }
            this._yScaleArray[child._groupName] = {yScale: child._yScale};
        });
    }

    _prepareYAxis () {
        this._removeMarkers();
        const left = (this._leftYAxisChildren().length !== 0);
        const right = (this._rightYAxisChildren().length !== 0);
        this._calculateYAxisRanges(left, right);

        this._children.forEach(child => {
            if (child.useRightYAxis()) {
                this._prepareRightYAxis(child);
            } else {
                this._prepareLeftYAxis(child);
            }
        });

        if (this._leftYAxisChildren().length > 0 && !this._rightAxisGridLines) {
            this._renderHorizontalGridLinesForAxis(this.g(), this.y(), this.yAxis());
        } else if (this._rightYAxisChildren().length > 0) {
            this._renderHorizontalGridLinesForAxis(this.g(), this._rightY, this._rightYAxis);
        }
    }

    _prepareLeftYAxis (child) {
        if (Object.keys(child._yScale).length === 0) {
            child._yScale = scaleLinear();
        }

        this.y(child._yScale.rangeRound([this.yAxisHeight(), 0]));

        this._yScaleArray[child._groupName].y = this.y();

        this._addMarker(child, false)
    }

    _prepareRightYAxis (child) {
        if (Object.keys(child._yScale).length === 0) {
            child._yScale = scaleLinear();
        }

        this.rightY(child._yScale.rangeRound([this.yAxisHeight(), 0]));

        this._yScaleArray[child._groupName].y = this.rightY();

        this._addMarker(child, false)
    }

    _removeMarkers () {
        this._markerPositions = {};
        this.svg().selectAll('.axis-marker').remove();
    }

    _addMarker (child, isRight) {
        if (typeof child._yDomain !== 'string') {
            this._markerPositions[child._groupName] = {
                axisPos: 0,
                isRight: isRight,
                markers: [child._groupName]
            }
        }
    }

    plotData () {
        for (let i = 0; i < this._children.length; ++i) {
            const child = this._children[i];

            if (!child.g()) {
                this._generateChildG(child, i);
            }

            if (this._shareColors) {
                child.colors(this.colors());
            }

            child.x(this.x());
            child.xAxis(this.xAxis());

            child.y(this._yScaleArray[child._groupName].y);
            child.yAxis(this.yAxis().scale(this._yScaleArray[child._groupName].y))

            child.plotData();

            this._drawMarker(child, i);

            child._activateRenderlets();
        }
    }

    _drawMarker (child, index) {
        const yName = child._groupName.split(/\/+|\(|\)|\s/g).join('').toLowerCase();

        child.g()
        .append('circle')
        .attr('id', `${yName}-marker`)
        .attr('class', 'axis-marker')
        .attr('fill', child.getColor(index))
        .attr('cx', 0)
        .attr('cy', 20)
        .attr('r', 5)
    }

    renderXAxis (g) {
        super.renderXAxis(g);

        if (this._centerXAxis) {
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

        this._children.forEach(child => {
            this._updateMarkerXPos(child);
        });
    }

    _updateMarkerXPos (child) {
        if (typeof child._yDomain !== 'string') {
            const markerGroup = this._markerPositions[child._groupName];

            markerGroup.markers.forEach((marker, index) => {
                const yName = marker.split(/\/+|\(|\)|\s/g).join('').toLowerCase();
                const offset = markerGroup.isRight ? markerGroup.axisPos + index * 12 : markerGroup.axisPos - index * 12;

                this.svg()
            .select(`#${yName}-marker`)
            .attr('cx', offset);
            });
        }
    }

    _createLeftYAxis (child, index) {
        if (typeof child._yDomain !== 'string') {
            const yLeftPos = this.margins().left - index * (this.margins().left / this._maxYAxes + this._maxYAxes);

            this._markerPositions[child._groupName].axisPos = yLeftPos;

            this.renderYAxisAt(
                `y${index}`,
                this.yAxis().scale(this._yScaleArray[child._groupName].y),
                yLeftPos
            );

            this.renderYAxisLabel(`y${index}`, this.yAxisLabel(), -90);
        }
        else {
            this._markerPositions[child._yDomain].markers.push(child._groupName);
        }
    }

    _createRightYAxis (child, index) {
        if (typeof child._yDomain !== 'string') {
            const yRightPos = this.width() - this.margins().right + index * (this.margins().right / this._maxYAxes + this._maxYAxes);

            this._markerPositions[child._groupName].axisPos = yRightPos;

            this.renderYAxisAt(
                `yr${index}`,
                this.rightYAxis().scale(this._yScaleArray[child._groupName].y),
                yRightPos
            );

            this.renderYAxisLabel(`yr${index}`, this.rightYAxisLabel(), 90, this.width() - this._rightYAxisLabelPadding);
        }
        else {
            this._markerPositions[child._yDomain].markers.push(child._groupName);
        }
    }
}

export const compositeMultiAxisChart = (parent, chartGroup) => new CompositeMultiAxisChart(parent, chartGroup);