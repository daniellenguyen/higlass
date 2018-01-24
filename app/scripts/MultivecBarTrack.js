import {BarTrack} from './BarTrack';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';

export class MultivecBarTrack extends BarTrack {
  constructor(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged) {
    super(scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged);
  }

  initTile(tile) {
    this.renderTile(tile);
  }

  renderTile(tile) {
    this.graphics = tile.graphics;
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
        (matrix[j] == null) ? singleBar = [] : singleBar = matrix[j];
        singleBar.push(flattenedArray[(shapeY * i) + j]);
        matrix[j] = singleBar;
      }
    }

    // normalize each array in matrix
    for (let i = 0; i < matrix.length; i++) {
      const temp = matrix[i];
      console.log(temp);
      const barValuesSum = temp.reduce((a, b) => a + b, 0);
      matrix[i] = temp.map((a) => a / barValuesSum);
    }

    this.drawVerticalBars(matrix, tileX, tileWidth);
  }

  /**
   * Draws one vertical line in the graph. Called for each color line.
   * @param matrix 2d array of numbers representing nucleotides
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   */
  drawVerticalBars(matrix, tileX, tileWidth) {
    const currentTrackHeight = this.dimensions[1];
    const colorScale = scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([0, currentTrackHeight]);
    let prevStackedBarHeight = 0;
    for (let j = 0; j < matrix.length; j++) { // jth vertical bar in the graph
      const x = this._xScale(tileX + (j * tileWidth / this.tilesetInfo.tile_size));
      const width = this._xScale(tileX + (tileWidth / this.tilesetInfo.tile_size)) - this._xScale(tileX);

      for (let i = 0; i < matrix[j].length; i++) {
        const y = this.position[0] + (prevStackedBarHeight * currentTrackHeight);
        const height = valueToPixels(matrix[j][i]);
        this.graphics.beginFill(colorToHex(colorScale(i)), 1);
        this.graphics.drawRect(x, y, width, height);

        prevStackedBarHeight = prevStackedBarHeight + matrix[j][i];
      }
      prevStackedBarHeight = 0;
    }
  }

  draw() {
    super.draw();
  }
}

export default MultivecBarTrack;
