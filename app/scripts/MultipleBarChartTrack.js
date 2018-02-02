import {BarTrack} from './BarTrack';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';
import {range} from 'd3-array';
import { scaleBand } from 'd3-scale';

export class MultipleBarChartTrack extends BarTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged);
  }

  initTile(tile) {
    this.renderTile(tile);
  }

  renderTile(tile) {
    const graphics = tile.graphics;
    tile.drawnAtScale = this._xScale.copy();

    // we're setting the start of the tile to the current zoom level
    const {tileX, tileWidth} = this.getTilePosAndDimensions(tile.tileData.zoomLevel,
      tile.tileData.tilePos, this.tilesetInfo.tile_size);
    const shapeX = tile.tileData.shape[0]; // number of different nucleotides in each bar
    const shapeY = tile.tileData.shape[1]; // number of bars
    const flattenedArray = tile.tileData.dense;

    // un-flatten data into matrix of tile.tileData.shape[0] x tile.tileData.shape[1]
    // first array in the matrix will be [flattenedArray[0], flattenedArray[256], flattenedArray[512], etc.]
    // because of how flattenedArray comes back from the server.
    const matrix = [];
    for (let i = 0; i < shapeX; i++) {//6
      for (let j = 0; j < shapeY; j++) {//256;
        let singleBar;
        (matrix[j] === undefined) ? singleBar = [] : singleBar = matrix[j];
        singleBar.push(flattenedArray[(shapeY * i) + j]);
        matrix[j] = singleBar;
      }
    }

    // normalize each array in matrix
    for (let i = 0; i < matrix.length; i++) {
      const temp = matrix[i];
      const barValuesSum = temp.reduce((a, b) => a + b, 0);
      matrix[i] = temp.map((a) => a / barValuesSum);
    }

    this.drawBarChart(graphics, matrix, tileX, tileWidth);
  }

  /**
   * helper function to draw a single bar chart in the track
   *
   * @param graphics PIXI.Graphics instance
   * @param matrix 2d array of numbers representing nucleotides
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   */
  drawBarChart(graphics, matrix, tileX, tileWidth) {
    const colorScale = scaleOrdinal(schemeCategory10).domain(range(matrix[0].length));
    graphics.clear();

    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const array = matrix[j];
      const x = this._xScale(tileX + ((j * tileWidth) / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);
      const intervalScale = scaleBand()
        .domain(range(-1, array.length))
        .range([0, this.dimensions[1]])
        .padding(0.1);
      const valueToPixels = scaleLinear()
        .domain([0, 1])
        .range([0, intervalScale.bandwidth()]);

      for (let i = 0; i < array.length; i++) {
        graphics.beginFill(colorToHex(colorScale(i)), 1);
        // separates each (vertically) consecutive bar while still showing correct value
        const height = valueToPixels(array[i]);
        const y = intervalScale(i) - height;
        graphics.drawRect(x, y, width, height);
      }
    }
  }

  // todo at smaller resolutions the bars start being non-contiguous
  // todo why does range(-1, array.length) work?


  draw() {
    super.draw();
  }

}

export default MultipleBarChartTrack;





