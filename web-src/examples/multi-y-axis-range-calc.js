/**
 * The getRangePerYAxis function takes in a series sets and out puts a set of range values for one or multiple y axes.
 * The ranges are compared against each other to see if a new axis is needed.
 * @param {Array} series is a multi dimensional number array representing all the series sets in the chart
 * @return Array of Objects consisting of the chart type, min and max y range values
 */

function getRangePerYAxis (series) {
    // series = {name: agg.property, data: seriesData}
    const rangesPerYAxis = [];

    for (const i in series) {
        // if only one value, set min to 0
        if (series[i].data.length === 1) {
            series[i].data.unshift(0);
        }
        matchesExistingSeries(rangesPerYAxis, series[i]);
    }
    return rangesPerYAxis;
}

/**
 * The matchesExistingSeries function does the work to compare the series against each other and
 * populates the rangesPerAxis array with the range Objects.
 * @param {Array} rangesPerYAxis Array of Objects consisting of the chart type, min and max y range values
 * @param {Array} match is the series that will be compared against the original
 */

function matchesExistingSeries (rangesPerYAxis, match) {
    const S2Min = Math.min(...match.data);
    const S2Max = Math.max(...match.data);
    if (rangesPerYAxis.length === 0) {
        const X = S2Max / S2Min;
        if (X < 1000) {
            rangesPerYAxis.push({name: match.name, useRange: [S2Min, S2Max], type: 'linear', min: S2Min, max: S2Max});
        } else {
            rangesPerYAxis.push({name: match.name, useRange: [S2Min, S2Max], type: 'log', min: S2Min, max: S2Max});
        }
    } else {
        for (const i in rangesPerYAxis) {
            const S1Min = rangesPerYAxis[i].min;
            const S1Max = rangesPerYAxis[i].max;
            const X = Math.max(S1Max, S2Max) / Math.min(S1Min, S2Min);

            // Falls into a stored range so use that
            if (X < 1000 && rangesPerYAxis[i].type === 'linear') {
                // update stored range min/max in case the match has a smaller min or bigger max
                rangesPerYAxis[i].min = Math.min(S1Min, S2Min);
                rangesPerYAxis[i].max = Math.max(S1Max, S2Max);
                rangesPerYAxis.push({
                    name: match.name,
                    useRange: rangesPerYAxis[i].name,
                    type: rangesPerYAxis[i].type,
                    min: rangesPerYAxis[i].min,
                    max: rangesPerYAxis[i].max,
                });
                return;
            } else if (X < 1000000 && rangesPerYAxis[i].type === 'log') {
                rangesPerYAxis[i].min = Math.min(S1Min, S2Min);
                rangesPerYAxis[i].max = Math.max(S1Max, S2Max);
                rangesPerYAxis.push({
                    name: match.name,
                    useRange: rangesPerYAxis[i].name,
                    type: rangesPerYAxis[i].type,
                    min: rangesPerYAxis[i].min,
                    max: rangesPerYAxis[i].max,
                });
                return;
            }
        }
        if (S2Max / S2Min < 1000) {
            rangesPerYAxis.push({name: match.name, useRange: [S2Min, S2Max], type: 'linear', min: S2Min, max: S2Max});
        } else {
            rangesPerYAxis.push({name: match.name, useRange: [S2Min, S2Max], type: 'log', min: S2Min, max: S2Max});
        }
    }
}

// Test data - move to unit tests
// const series = [[500, 48000], [200, 40000], [0.0005, 5000], [12000000, 25000000000000000]];

export default getRangePerYAxis;
