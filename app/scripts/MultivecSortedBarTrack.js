import {BarTrack} from './BarTrack';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';

export class MultivecSortedBarTrack extends BarTrack {
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

    if (this.options.scaledHeight === false) { //todo change this back to true for option after debugging
      let prevLargest = 0;
      for (let i = 0; i < matrix.length; i++) {
        const temp = matrix[i];
        const barValuesSum = temp.reduce((a, b) => a + b, 0);
        (barValuesSum > prevLargest) ? prevLargest = barValuesSum : prevLargest;
      }
      this.drawVerticalBars(graphics, matrix, tileX, tileWidth, prevLargest);
    }
    else {
      // normalize each array in matrix
      for (let i = 0; i < matrix.length; i++) {
        const temp = matrix[i];
        const barValuesSum = temp.reduce((a, b) => a + b, 0);
        matrix[i] = temp.map((a) => a / barValuesSum);
      }
      this.drawNormalizedBars(graphics, matrix, tileX, tileWidth);
    }
  }

  /**
   * Draws graph using normalized values.
   *
   * @param graphics PIXI.Graphics instance
   * @param matrix 2d array of numbers representing nucleotides
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   * @param maxHeight the height of the tallest bar in the graph
   * @param minHeight the smallest value in the matrix
   */
  drawVerticalBars(graphics, matrix, tileX, tileWidth, maxHeight, minHeight) {
    graphics.clear();
    const currentTrackHeight = this.dimensions[1];
    const colorScale = scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, maxHeight])
      .range([0, currentTrackHeight]);
    let prevStackedBarHeight = 0;

    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);

      // mapping each value to its original color. color: value
      const rowWithOriginalIndices = {};
      for (let i = 0; i < matrix[j].length; i++) {
        rowWithOriginalIndices[colorToHex(colorScale(i))] = matrix[j][i];
      }

      const sorted = matrix[j].sort((a, b) => { return a - b; });
      for(let i = 0; i < sorted.length; i++) {
        const height = valueToPixels(sorted[i]);
        const y = currentTrackHeight - (prevStackedBarHeight + height);
        for (let k in rowWithOriginalIndices) {
          if (rowWithOriginalIndices[k] !== null
            && rowWithOriginalIndices[k] === sorted[i]) {
            graphics.beginFill(k, 1);
          }
        }
        graphics.drawRect(x, y, width, height);
        prevStackedBarHeight = prevStackedBarHeight + height;
      }
      prevStackedBarHeight = 0;
    }

  }

  /**
   * Draws graph using normalized values.
   *
   * @param graphics PIXI.Graphics instance
   * @param matrix 2d array of numbers representing nucleotides
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   */
  drawNormalizedBars(graphics, matrix, tileX, tileWidth) {
    graphics.clear();
    const currentTrackHeight = this.dimensions[1];
    const colorScale = scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([0, currentTrackHeight]);
    let prevStackedBarHeight = 0;

    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);

      // mapping each value to its original color. color: value
      const rowWithOriginalIndices = {};
      for (let i = 0; i < matrix[j].length; i++) {
        rowWithOriginalIndices[colorToHex(colorScale(i))] = matrix[j][i];
      }

      const sorted = matrix[j].sort((a, b) => { return b - a; });
      for(let i = 0; i < sorted.length; i++) {
        const y = this.position[0] + (prevStackedBarHeight * currentTrackHeight);
        const height = valueToPixels(sorted[i]);
        for (let k in rowWithOriginalIndices) {
          if (rowWithOriginalIndices[k] !== null
            && rowWithOriginalIndices[k] === sorted[i]) {
            graphics.beginFill(k, 1);
          }
        }
        graphics.drawRect(x, y, width, height);
        prevStackedBarHeight = prevStackedBarHeight + sorted[i];
      }
      prevStackedBarHeight = 0;
    }
  }

  draw() {
    super.draw();
  }
}

export default MultivecSortedBarTrack;
