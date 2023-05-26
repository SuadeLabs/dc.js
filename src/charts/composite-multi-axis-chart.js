import {CompositeChart} from './composite-chart';
import {transition} from '../core/core';

export class CompositeMultiAxisChart extends CompositeChart {
    constructor (parent, chartGroup) {
        super(parent, chartGroup);

        this._customRanges = [];
        this._markerPositions = {}
        this._centerXAxis = false;
    }

    _calculateYAxisRanges () {
        this._children.forEach(child => {
            if (child._domain[0] < 0) {
                this._centerXAxis = true;
            }
            this._customRanges[child._groupName] = {range: child._useCustomYRange};
        });
    }

    _prepareYAxis () {
        this._calculateYAxisRanges();

        this._children.forEach(child => {
            if (child.useRightYAxis()) {
                this.rightY(child._useCustomYRange.rangeRound([this.yAxisHeight(), 0]));

                this._customRanges[child._groupName].y = this.rightY();

                this._addMarker(child, true);
            } else {
                this.y(child._useCustomYRange.rangeRound([this.yAxisHeight(), 0]));

                this._customRanges[child._groupName].y = this.y();

                this._addMarker(child, false);
            }
        });

        if (this._leftYAxisChildren().length > 0 && !this._rightAxisGridLines) {
            this._renderHorizontalGridLinesForAxis(this.g(), this.y(), this.yAxis());
        } else if (this._rightYAxisChildren().length > 0) {
            this._renderHorizontalGridLinesForAxis(this.g(), this._rightY, this._rightYAxis);
        }
    }

    _addMarker (child, isRight) {
        if (typeof child._domain !== 'string') {
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

            child.y(this._customRanges[child._groupName].y);
            child.yAxis(this.yAxis().scale(this._customRanges[child._groupName].y))

            child.plotData();

            this._drawMarker(child, i);

            child._activateRenderlets();
        }
    }

    _drawMarker (child, index) {
        const yName = child._groupName.split(' ').join('').toLowerCase();

        child.g()
        .append('circle')
        .attr('id', `${yName}-marker`)
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
        let markerGroup = {};

        // TODO: this typeof check is a code smell as it appears in more than one place
        // refactor the way we handle domains that inherit from other domains to create the y axes
        if (typeof child._domain !== 'string') {
            markerGroup = this._markerPositions[child._groupName];
        } else {
            markerGroup = this._markerPositions[child._domain];
        }

        markerGroup.markers.forEach((marker, index) => {
            const yName = marker.split(' ').join('').toLowerCase();
            const offset = markerGroup.isRight ? markerGroup.axisPos + index * 12 : markerGroup.axisPos - index * 12;

            this.svg()
            .select(`#${yName}-marker`)
            .attr('cx', offset);
        });
    }

    _createLeftYAxis (child, index) {
        if (typeof child._domain !== 'string') {
            // TODO make magic numbers in this calc configurable - maybe set a max num of axes?
            const yLeftPos = this.margins().left - index * (this.margins().left / 6 + 6);

            this._markerPositions[child._groupName].axisPos = yLeftPos;

            this.renderYAxisAt(
                `y${index}`,
                this.yAxis().scale(this._customRanges[child._groupName].y),
                yLeftPos
            );

            this.renderYAxisLabel(`y${index}`, this.yAxisLabel(), -90);
        }
        else {
            this._markerPositions[child._domain].markers.push(child._groupName);
        }
    }

    _createRightYAxis (child, index) {
        if (typeof child._domain !== 'string') {
            // TODO make magic numbers in this calc configurable - maybe set a max num of axes?
            const yRightPos = this.width() - this.margins().right + index * (this.margins().right / 6 + 6);

            this._markerPositions[child._groupName].axisPos = yRightPos;

            this.renderYAxisAt(
                `yr${index}`,
                this.rightYAxis().scale(this._customRanges[child._groupName].y),
                yRightPos
            );

            this.renderYAxisLabel(`yr${index}`, this.rightYAxisLabel(), 90, this.width() - this._rightYAxisLabelPadding);
        }
        else {
            this._markerPositions[child._domain].markers.push(child._groupName);
        }
    }
}

export const compositeMultiAxisChart = (parent, chartGroup) => new CompositeMultiAxisChart(parent, chartGroup);