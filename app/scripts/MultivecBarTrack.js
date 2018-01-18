import {BarTrack} from './BarTrack';

import { scaleLinear, scaleOrdinal, schemeCategory10 } from 'd3-scale';
import { colorToHex } from './utils';

class MultivecBarTrack extends BarTrack {
  constructor( scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged ) {
    super( scene, dataConfig, handleTilesetInfoReceived, option, animate, onValueScaleChanged );
  }

  renderTile(tile) {
    //super.drawTile(tile);

    console.log('renderTile tile:', tile);
    console.log("tile", tile);
    this.graphics = tile.graphics;
    const { tileX, tileWidth } = this.getTilePosAndDimensions(tile.tileData.zoomLevel, tile.tileData.tilePos);
    for (let i = 0; i < this.arrayList.length; i++) {
      this.drawVerticalBars(i, tileX, tileWidth);
    }
  }
  /**
   * Draws one vertical line in the graph. Called for each color line.
   * @param barNumber the vertical bars' order from left to right
   * @param tileX starting position of tile
   * @param tileWidth pre-scaled width of tile
   */
  drawVerticalBars(barNumber, tileX, tileWidth) {
    const widthInNucleotides = tileWidth;
    const distance = tileX;
    const currentTrackHeight = this.dimensions[1];
    const values = this.arrayList[barNumber];
    // distance between vertical bars in nucleotides
    const colorScale = scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([0, currentTrackHeight]);
    let prevStackedBarHeight = 0;

    for(let i = 0; i < values.length; i++) {
      const x = this._xScale(distance * barNumber);
      const y = this.position[1] + (prevStackedBarHeight * currentTrackHeight);
      const width = this._xScale(distance + widthInNucleotides) - this._xScale(distance);
      const height = valueToPixels(values[i]);
      this.graphics.beginFill(colorToHex(colorScale(i)), 1);
      this.graphics.drawRect(x, y, width, height);
      prevStackedBarHeight = prevStackedBarHeight + values[i];
    }
  }

}

export default MultivecBarTrack;
