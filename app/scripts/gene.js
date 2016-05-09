import '../styles/gene.css';

import d3 from 'd3';
import {getRadius} from './helper_module.js';


export function GenePlot() {
    let width = 300;
    let height = 10;
    let xPos = 0;
    let yPos = 0;
    let arrowSpace = 10;     // the space betweent the arrows indicating the direction
                             // of the transcript

    let xScale = null;
    let gMain = null;

    let lineGene = null;
    let rectExons = [];
    let circleGene = null;
    let exonRects = null;
    let geneLabels = null;

    let minImportance = 0;
    let maxImportance = 0;

    function draw() {
        let geneJson = lineGene.data()[0];
        let lineLength = xScale(geneJson.txEnd) - xScale(geneJson.txStart);

        let importanceScale = d3.scale.linear()
        .domain([Math.sqrt(minImportance), Math.sqrt(maxImportance)])
        .range([1,3])

        if (lineLength < 10) {
            // if we're so zoomed out that the genes are barely visible
            // just draw a circle instead

            circleGene.style('opacity', 1.)
            .attr('cx', (d) => { return xScale(+geneJson.txStart + geneJson.chromOffset); })
            .attr('cy', (d) => { return height / 2})
            .attr('r', (d) => { 
                return importanceScale(Math.sqrt(d.count)) })
            .classed('gene-marker', true)

            exonRects.attr('visibility', 'hidden');
        } else {
            circleGene.style('opacity', 0.);

            exonRects.attr('x', (d) => xScale(d[0]))
                    .attr('y', 0)
                    .attr('width', (d) => xScale(d[1]) - xScale(d[0]))
                    //.attr('width', 10)
                    .attr('height', height)
                    .attr('visibility', 'visible')
                    .attr('id', (d) => { return `c-${geneJson.refseqid}`})

            lineGene.attr('x1', (d) => xScale(d.chromOffset + +d.txStart))
                    .attr('x2', (d) => xScale(d.chromOffset + +d.txEnd))
                    .attr('y1', height / 2)
                    .attr('y2', height / 2)
                    .attr('visibility', 'visible')
                    .attr('id', (d) => { return `c-${geneJson.refseqid}`})
        }

        geneLabels.attr('x', (d) => {
            return xScale((+geneJson.txStart + +geneJson.txEnd) / 2 + geneJson.chromOffset); })
        .attr('y', -5);
    }

    function chart(selection) {
        selection.each(function(geneJson) {
                geneJson.chromOffset = geneJson.genomeTxStart - geneJson.txStart;
                let gMain = d3.select(this);

                lineGene = gMain.append('line')
                .classed('gene-line', true);

                circleGene = gMain.append('circle')
                .classed('gene-circle', true)
                .attr('id', (d) => { 
                    return `n-${geneJson.refseqid}`;
                })

                geneLabels = gMain.append('text')
                .classed('gene-label', true)
                .text((d) => { return d.geneName; })
                .attr('text-anchor', 'middle')

                function zip(arrays) {
                    return arrays[0].map(function(_,i){
                        return arrays.map(function(array){return array[i]})
                    });
                }

                let exons = zip([geneJson.exonStarts.split(','), 
                                 geneJson.exonEnds.split(',')]);
                exons = exons.map((d) => { return [geneJson.chromOffset + +d[0], 
                                                   geneJson.chromOffset + +d[1]] })
                exonRects = gMain.selectAll('rect')
                .data(exons)
                .enter()
                .append('rect')
                .classed('exon-rect', true)

                // draw the arrows in the direction that this transcript is facing
                /*
                let start = 0;
                while (start < width) {
                    gMain.append('line')
                    .attr('x1', start + 3)
                    .attr('y1', (1 / 4.) * height)
                    .attr('x2', start)
                    .attr('y2', height / 2)
                    .classed('arrow-line', true)

                    gMain.append('line')
                    .attr('x1', start + 3)
                    .attr('y1', (3 / 4.) * height)
                    .attr('x2', start)
                    .attr('y2', height / 2)
                    .classed('arrow-line', true)

                     start += 10;
                }
                */
        });
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.xPos = function(_) {
        if (!arguments.length) return xPos;
        xPos = _;
        return chart;
    };

    chart.yPos = function(_) {
        if (!arguments.length) return yPos;
        yPos = _;
        return chart;
    };

    chart.xScale = function(_) {
        if (!arguments.length) return xScale;
        xScale = _;
        return chart;
    };

    chart.minImportance = function(_) {
        if (!arguments.length) return minImportance;
        minImportance = _;
        return chart;
    }

    chart.maxImportance = function(_) {
        if (!arguments.length) return maxImportance;
        maxImportance = _;
        return chart;
    }

    chart.draw = draw;

    return chart;
}
