import { BarTrack } from './BarTrack';
import { scaleLinear, scaleOrdinal, schemeCategory10 } from 'd3-scale';
import { colorToHex } from './utils';
import { range } from 'd3-array';

class MultipleLineChartTrack extends BarTrack {
  constructor(scene,
              dataConfig,
              handleTilesetInfoReceived,
              option,
              animate,
              onValueScaleChanged,) {
    super(
      scene,
      dataConfig,
      handleTilesetInfoReceived,
      option,
      animate,
      onValueScaleChanged,
    );

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
      for (let j = 0; j < shapeY; j++) {//256
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

    this.drawLines(graphics, matrix, tileX, tileWidth);
  }


  /**
   * helper function to draw a single line in the track
   * @param graphics PIXI.Graphics instance
   * @param matrix 2d array of numbers representing nucleotides
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   */
  drawLines(graphics, matrix, tileX, tileWidth) {
    graphics.clear();
    const arrayLength = matrix[0].length;
    const currentTrackHeight = this.dimensions[1];
    // interval height for each line. if interval is negative make it 0.
    const lineInterval = ((currentTrackHeight) / (arrayLength) < 0) ? 0 : (currentTrackHeight) / (arrayLength);
    const colorScale = scaleOrdinal(schemeCategory10).domain(range(arrayLength));
    const valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([0, lineInterval]);

    for(let i = 0; i < arrayLength; i++) {
      graphics.lineStyle(1, colorToHex(colorScale(i)), 1);

      for(let j = 0; j < matrix.length; j++) {
        array = matrix[i];
        const x = this._xScale(tileX + ((j * tileWidth) / this.tilesetInfo.tile_size));
        const y = (this.position[0] + (lineInterval * i)) + valueToPixels(matrix[j][i]);
        // move draw position back to the start at beginning of each line
        (j == 0) ? graphics.moveTo(x, y) : graphics.lineTo(x, y);
      }
    }
  }

  draw() {
    super.draw();
  }

}

export default MultipleLineChartTrack;

