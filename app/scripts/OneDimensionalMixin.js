import {Mixin} from './mixwith';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {colorToHex} from './utils';

export const OneDimensionalMixin = Mixin(superclass => class extends superclass {

  initTile(tile) {
    // create the tile
    // should be overwritten by child classes
    this.scale.minRawValue = this.minVisibleValue();
    this.scale.maxRawValue = this.maxVisibleValue();

    this.scale.minValue = this.scale.minRawValue;
    this.scale.maxValue = this.scale.maxRawValue;

    this.maxAndMin.max = this.scale.maxValue;
    this.maxAndMin.min = this.scale.minValue;

    this.localColorToHexScale();

    this.unFlatten(tile);

    tile.svgData = null;
    tile.mouseOverData = null;

    this.renderTile(tile);
    this.rescaleTiles();
  }

  rerender(newOptions) {
    this.options = newOptions;
    const visibleAndFetched = this.visibleAndFetchedTiles();

    for (let i = 0; i < visibleAndFetched.length; i++) {
      this.updateTile(visibleAndFetched[i]);
    }
  }

  updateTile(tile) {
    const visibleAndFetched = this.visibleAndFetchedTiles();

    for (let i = 0; i < visibleAndFetched.length; i++) {
      const tile = visibleAndFetched[i];
      this.unFlatten(tile);
    }

    this.rescaleTiles();
  }

  /**
   * Rescales the sprites of all visible tiles when zooming and panning.
   */
  rescaleTiles() {}

  /**
   * Converts all colors in a colorScale to Hex colors.
   */
  localColorToHexScale() {
    const colorScale = this.options.colorScale || scaleOrdinal(schemeCategory10);
    let colorHexMap = {};
    for (let i = 0; i < colorScale.length; i++) {
      colorHexMap[colorScale[i]] = colorToHex(colorScale[i]);
    }
    this.colorHexMap = colorHexMap;
  }

  /**
   * Find max and min heights for the given tile
   *
   * @param matrix 2d array of numbers representing one tile
   */
  findMaxAndMin(matrix) {
    // find max height of bars for scaling in the track
    let maxAndMin = {
      max: null,
      min: null
    };

    for (let i = 0; i < matrix.length; i++) {
      const temp = matrix[i];

      // find total heights of each positive column and each negative column
      // and compare to highest value so far for the tile
      const localPositiveMax = temp.filter((a) => a >= 0).reduce((a, b) => a + b, 0);
      (localPositiveMax > maxAndMin.max) ? maxAndMin.max = localPositiveMax : maxAndMin.max;

      let negativeValues = temp.filter((a) => a < 0);
      if (negativeValues.length > 0) {
        negativeValues = negativeValues.map((a) => Math.abs(a));
        const localNegativeMax = negativeValues.reduce((a, b) => a + b, 0); // check
        (maxAndMin.min === null || localNegativeMax > maxAndMin.min) ?
          maxAndMin.min = localNegativeMax : maxAndMin.min;
      }
    }

    return maxAndMin;

  }

  /**
   * un-flatten data into matrix of tile.tileData.shape[0] x tile.tileData.shape[1]
   *
   * @param tile
   * @returns {Array} 2d array of numerical values for each column
   */
  unFlatten(tile) {
    if (tile.matrix) {
      return tile.matrix;
    }
    else {
      let flattenedArray = tile.tileData.dense;

      // if any data is negative, switch to exponential scale
      if (flattenedArray.filter((a) => a < 0).length > 0 && this.options.valueScaling === 'linear') {
        console.warn('Negative values present in data. Defaulting to exponential scale.');
        this.options.valueScaling = 'exponential';
      }

      const matrix = this.simpleUnFlatten(tile, flattenedArray);

      const maxAndMin = this.findMaxAndMin(matrix);

      tile.matrix = matrix;
      tile.maxValue = maxAndMin.max;
      tile.minValue = maxAndMin.min;

      return matrix;
    }
  }

  /**
   *
   * @param tile
   * @param data array of values to reshape
   * @returns {Array} 2D array representation of data
   */
  simpleUnFlatten(tile, data) {
    const shapeX = tile.tileData.shape[0]; // number of different nucleotides in each bar
    const shapeY = tile.tileData.shape[1]; // number of bars

    // matrix[0] will be [flattenedArray[0], flattenedArray[256], flattenedArray[512], etc.]
    // because of how flattenedArray comes back from the server.
    const matrix = [];
    for (let i = 0; i < shapeX; i++) {//6
      for (let j = 0; j < shapeY; j++) {//256;
        let singleBar;
        (matrix[j] === undefined) ? singleBar = [] : singleBar = matrix[j];
        singleBar.push(data[(shapeY * i) + j]);
        matrix[j] = singleBar;
      }
    }

    return matrix;
  }


});

export default OneDimensionalMixin;
