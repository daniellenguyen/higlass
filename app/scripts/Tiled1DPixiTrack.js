import TiledPixiTrack from './TiledPixiTrack';

import { tileProxy } from './services';

export class Tiled1DPixiTrack extends TiledPixiTrack {
  initTile(tile) {
    /**
         * We don't need to do anything but draw the tile.
         *
         * Child classes that rely on transforming tiles when zooming
         * and panning can override this function to draw all the elements
         * that will later be transformed.
         */
    // this.drawTile(tile);
    super.initTile(tile);
  }

  tileToLocalId(tile) {
    /*
         * The local tile identifier
         */

    // tile contains [zoomLevel, xPos]
    return `${tile.join('.')}`;
  }

  tileToRemoteId(tile) {
    /**
         * The tile identifier used on the server
         */

    // tile contains [zoomLevel, xPos]
    return `${tile.join('.')}`;
  }


  relevantScale() {
    /**
         * Which scale should we use for calculating tile positions?
         *
         * Horizontal tracks should use the xScale and vertical tracks
         * should use the yScale
         *
         * This function should be overwritten by HorizontalTiled1DPixiTrack.js
         * and VerticalTiled1DPixiTrack.js
         */
    return null;
  }

  setVisibleTiles(tilePositions) {
    /**
         * Set which tiles are visible right now.
         *
         * @param tiles: A set of tiles which will be considered the currently visible
         * tile positions.
         */
    this.visibleTiles = tilePositions.map(x => ({
      tileId: this.tileToLocalId(x),
      remoteId: this.tileToRemoteId(x),
    }));

    this.visibleTileIds = new Set(this.visibleTiles.map(x => x.tileId));
  }

  calculateVisibleTiles() {
    // if we don't know anything about this dataset, no point
    // in trying to get tiles
    if (!this.tilesetInfo) { return; }

    // calculate the zoom level given the scales and the data bounds
    this.zoomLevel = this.calculateZoomLevel();

    if (this.tilesetInfo.resolutions) {
      const sortedResolutions = this.tilesetInfo.resolutions
        .map(x => +x)
        .sort((a, b) => b - a);

      const xTiles = tileProxy.calculateTilesFromResolution(
        sortedResolutions[this.zoomLevel],
        this._xScale,
        this.tilesetInfo.min_pos[0], this.tilesetInfo.max_pos[0]
      );

      const tiles = xTiles.map(x => [this.zoomLevel, x]);
      this.setVisibleTiles(tiles);
      return;
    }

     //console.log('zoomLevel:', this.zoomLevel);

    // x doesn't necessary mean 'x' axis, it just refers to the relevant axis
    // (x if horizontal, y if vertical)
    const xTiles = tileProxy.calculateTiles(this.zoomLevel, this.relevantScale(),
      this.tilesetInfo.min_pos[0],
      this.tilesetInfo.max_pos[0],
      this.tilesetInfo.max_zoom,
      this.tilesetInfo.max_width);

    const tiles = xTiles.map(x => [this.zoomLevel, x]);
    this.setVisibleTiles(tiles);
  }


  getTilePosAndDimensions(zoomLevel, tilePos, binsPerTileIn) {
    /**
         * Get the tile's position in its coordinate system.
         */
    const xTilePos = tilePos[0];
    const yTilePos = tilePos[0];


    if (this.tilesetInfo.resolutions) {
      const BINS_PER_TILE = 1024;
      // the default bins per tile which should
      // not be used because the right value should be in the tileset info

      let binsPerTile = binsPerTileIn || BINS_PER_TILE;

      const sortedResolutions = this.tilesetInfo.resolutions
        .map(x => +x)
        .sort((a, b) => b - a);

      const chosenResolution = sortedResolutions[zoomLevel];

      let tileWidth =  chosenResolution * binsPerTile;
      let tileHeight = tileWidth;

      let tileX = chosenResolution * binsPerTile * tilePos[0];
      let tileY = chosenResolution * binsPerTile * tilePos[1];

      return { tileX, tileY, tileWidth, tileHeight };
    }

    // max_width should be substitutable with 2 ** tilesetInfo.max_zoom
    const totalWidth = this.tilesetInfo.max_width;
    const totalHeight = this.tilesetInfo.max_width;

    const minX = this.tilesetInfo.min_pos[0];
    const minY = this.tilesetInfo.min_pos[1];

    const tileWidth = totalWidth / Math.pow(2, zoomLevel);
    const tileHeight = totalHeight / Math.pow(2, zoomLevel);

    const tileX = minX + xTilePos * tileWidth;
    const tileY = minY + yTilePos * tileHeight;

    return { tileX,
      tileY,
      tileWidth,
      tileHeight };
  }

  updateTile(tile) {
    // no need to redraw this tile, usually
    // unless the data scale changes or something like that


  }
}

export default Tiled1DPixiTrack;
