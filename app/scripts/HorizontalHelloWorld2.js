import * as PIXI from 'pixi.js';

import {PixiTrack} from './PixiTrack';

import {scaleLinear} from 'd3-scale';

class HorizontalHelloWorld2 extends PixiTrack {
  constructor(scene, options, animate) {
    super(scene, options);
    this.makeData();
  }

  /**
   * Make a a 2d array of random numbers to use as test data
   */
  makeData() {
    this.arrayList = [];
    for (let i = 0; i < 100; i++) {
      let fourLetters = [];
      for (let j = 0; j < 4; j++) {
        fourLetters.push(Math.random());
      }
      const sum = fourLetters.reduce((total, num) => {
        return total + num
      });
      for (let j = 0; j < fourLetters.length; j++) {
        fourLetters[j] = fourLetters[j] / sum;
      }
      this.arrayList.push(fourLetters);
    }
  }

  /**
   * helper function to draw a single line in the track
   *
   * @param color line color
   * @param lineNumber which line are we drawing?
   */
  drawAllLines(color, lineNumber) {
    const distance = 50000000;
    for (let i = 0; i < this.arrayList.length; i++) {
      const array = this.arrayList[i];
      const x = this._xScale(i * distance);
      const y = this.valueToPixels(array[lineNumber]);
      this.pMain.lineStyle(1, color, 1);
      this.pMain.lineTo(x, y);
    }
  }

  draw() {
    // converts y values on a scale [0, 1] to pixels
    this.valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([100, 150]);
    // Math.random isn't in the dataset, it's just a placeholder for a
    // better fix
    this.pMain.moveTo(50000000, this.valueToPixels(Math.random()));
    this.drawAllLines(0xFF0000, 0);
    this.pMain.currentPath.shape.closed = false;
    this.pMain.moveTo(50000000, this.valueToPixels(Math.random()));
    this.drawAllLines(0xf4eb42, 1);
    this.pMain.currentPath.shape.closed = false;
    this.pMain.moveTo(50000000, this.valueToPixels(Math.random()));
    this.drawAllLines(0x6ef441, 2);
    this.pMain.currentPath.shape.closed = false;
    this.pMain.moveTo(50000000, this.valueToPixels(Math.random()));
    this.drawAllLines(0x4179f4, 3);
    this.pMain.currentPath.shape.closed = false;
  }


  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);
    this.pMain.clear(); // should remove?
    this.draw();
  }

}

export default HorizontalHelloWorld2;

