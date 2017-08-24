import PropTypes from 'prop-types';
import React from 'react';

import { brushX } from 'd3-brush';
import { select, event } from 'd3-selection';
import slugid from 'slugid';

import ListWrapper from './ListWrapper';
import HorizontalItem from './HorizontalItem';
import SortableList from './SortableList';

// Services
import { pubSub } from './services';

// Utils
import { or, sum } from './utils';

// Configs
import { isTrackRangeSelectable } from './config';

// Styles
import styles from '../styles/HorizontalTiledPlot.scss';  // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.scss';  // eslint-disable-line no-unused-vars


class HorizontalTiledPlot extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      rangeSelecting: false
    };

    this.pubSubs = [];

    this.brushBehavior = brushX().on('brush', this.brushed.bind(this));
  }

  /* -------------------------- Life Cycle Methods -------------------------- */

  componentWillMount() {
    this.pubSubs = [];
    this.pubSubs.push(
      pubSub.subscribe('keydown', this.keyDownHandler.bind(this))
    );
    this.pubSubs.push(
      pubSub.subscribe('keyup', this.keyUpHandler.bind(this))
    );
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.rangeSelectionTriggered) {
      this.rangeSelectionTriggered = false;
      return this.state !== nextState;
    } else if (this.props.rangeSelection !== nextProps.rangeSelection) {
      this.moveBrush(nextProps.rangeSelection);
      return this.state !== nextState;
    }
    return true;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.rangeSelecting !== this.state.rangeSelecting) {
      if (this.state.rangeSelecting) {
        this.addBrush();
      } else {
        this.removeBrush();
      }
    }
  }

  componentWillUnmount() {
    this.pubSubs.forEach(subscription => pubSub.unsubscribe(subscription));
    this.pubSubs = [];
  }

  /* ---------------------------- Custom Methods ---------------------------- */

  addBrush() {
    if (!this.brushEl) { return; }

    this.brushEl.call(this.brushBehavior);
  }

  brushed() {
    // Need to reassign variable to check after reset
    const rangeSelectionMoved = this.rangeSelectionMoved;
    this.rangeSelectionMoved = false;

    if (
      !event.sourceEvent ||
      !this.props.onRangeSelection ||
      rangeSelectionMoved
    ) return;

    this.rangeSelectionTriggered = true;
    this.props.onRangeSelection(event.selection);

    // const x0 = selection[0][0];
    // const y0 = selection[0][1];
    // const x1 = selection[1][0];
    // const y1 = selection[1][1];
    // const dx = x1 - x0;
    // const dy = y1 - y0;
  }

  moveBrush(rangeSelection) {
    if (!this.brushEl) { return; }

    this.rangeSelectionMoved = true;
    this.brushEl.call(this.brushBehavior.move, rangeSelection[0]);
  }

  keyDownHandler(event) {
    if (event.key === 'Alt') {
      this.setState({
        rangeSelecting: true
      });
    }
  }

  keyUpHandler(event) {
    if (event.key === 'Alt') {
      this.setState({
        rangeSelecting: false
      });
    }
  }

  removeBrush() {
    if (this.brushEl) {
      // Reset brush selection
      this.brushEl.call(
        this.brushBehavior.move,
        null
      );

      // Remove brush behavior
      this.brushEl.on('.brush', null);
    }
  }

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    const height = this.props.tracks.map(x => x.height).reduce(sum, 0);

    const isBrushable = this.props.tracks
      .map(track => isTrackRangeSelectable(track))
      .reduce(or, false);

    const rangeSelectorClass = this.state.rangeSelecting ?
      'stylesTrack.track-range-selection-active' :
      'stylesTrack.track-range-selection';

    return (
      <div styleName="styles.horizontal-tiled-plot">
        {this.props.isRangeSelectable && isBrushable &&
          <svg
            ref={el => this.brushEl = select(el)}
            style={{
              height: height,
              width: this.props.width
            }}
            styleName={rangeSelectorClass}
            xmlns="http://www.w3.org/2000/svg"
          />
        }
        <ListWrapper
          className="list stylizedList"
          component={SortableList}
          editable={this.props.editable}
          handleConfigTrack={this.props.handleConfigTrack}
          handleResizeTrack={this.props.handleResizeTrack}
          height={height}
          helperClass="stylizedHelper"
          itemClass="stylizedItem"
          itemReactClass={HorizontalItem}
          items={this.props.tracks.map(d => ({
            uid: d.uid || slugid.nice(),
            width: this.props.width,
            height: d.height,
            value: d.value
          }))}
          onAddSeries={this.props.onAddSeries}
          onCloseTrack={this.props.onCloseTrack}
          onCloseTrackMenuOpened={this.props.onCloseTrackMenuOpened}
          onConfigTrackMenuOpened={this.props.onConfigTrackMenuOpened}
          onSortEnd={this.props.handleSortEnd}
          referenceAncestor={this.props.referenceAncestor}
          resizeHandles={this.props.resizeHandles}
          useDragHandle={true}
          width={this.props.width}
        />
      </div>
    );
  }
}

HorizontalTiledPlot.propTypes = {
  editable: PropTypes.bool,
  handleConfigTrack: PropTypes.func,
  handleResizeTrack: PropTypes.func,
  handleSortEnd: PropTypes.func,
  isRangeSelectable: PropTypes.bool,
  onAddSeries: PropTypes.func,
  onCloseTrack: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  onRangeSelection: PropTypes.func,
  rangeSelection: PropTypes.array,
  referenceAncestor: PropTypes.func,
  resizeHandles: PropTypes.object,
  tracks: PropTypes.array,
  width: PropTypes.number
}

export default HorizontalTiledPlot;