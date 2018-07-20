import cn from 'classnames'
import getHeight from 'dom-helpers/query/height'
import qsa from 'dom-helpers/query/querySelectorAll'
import PropTypes from 'prop-types'
import React from 'react'
import { findDOMNode } from 'react-dom'

import dates from './utils/dates'
import { accessor, elementType } from './utils/propTypes'
import {
  eventSegments,
  endOfRange,
  eventLevelsBySpanning,
} from './utils/eventLevels'
import BackgroundCells from './BackgroundCells'
import EventRow from './EventRow'
import DailyEventRow from './DailyEventRow'

let isSegmentInSlot = (seg, slot) => seg.left <= slot && seg.right >= slot

const propTypes = {
  date: PropTypes.instanceOf(Date),
  events: PropTypes.array.isRequired,
  range: PropTypes.array.isRequired,

  rtl: PropTypes.bool,
  renderForMeasure: PropTypes.bool,
  renderHeader: PropTypes.func,

  container: PropTypes.func,
  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,

  onShowMore: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEnd: PropTypes.func,
  onSelectStart: PropTypes.func,
  dayPropGetter: PropTypes.func,

  getNow: PropTypes.func.isRequired,
  startAccessor: accessor.isRequired,
  endAccessor: accessor.isRequired,

  eventComponent: elementType,
  eventWrapperComponent: elementType.isRequired,
  dateCellWrapperComponent: elementType,
  minRows: PropTypes.number.isRequired,
  maxRows: PropTypes.number.isRequired,
  hideOverlay: PropTypes.func,
}

const defaultProps = {
  minRows: 0,
  maxRows: Infinity,
}

class VarHeightDateContentRow extends React.Component {
  handleSelectSlot = slot => {
    const { range, onSelectSlot } = this.props

    onSelectSlot(range.slice(slot.start, slot.end + 1), slot)
  }

  handleShowMore = slot => {
    const { range, onShowMore } = this.props
    let row = qsa(findDOMNode(this), '.rbc-row-bg')[0]

    let cell
    if (row) cell = row.children[slot - 1]

    let events = this.segments
      .filter(seg => isSegmentInSlot(seg, slot))
      .map(seg => seg.event)

    onShowMore(events, range[slot - 1], cell, slot)
  }

  createHeadingRef = r => {
    this.headingRow = r
  }

  createEventRef = r => {
    this.eventRow = r
  }

  getContainer = () => {
    const { container } = this.props
    return container ? container() : findDOMNode(this)
  }

  getRowLimit() {
    let eventHeight = getHeight(this.eventRow)
    let headingHeight = this.headingRow ? getHeight(this.headingRow) : 0
    let eventSpace = getHeight(findDOMNode(this)) - headingHeight

    return Math.max(Math.floor(eventSpace / eventHeight), 1)
  }

  renderHeadingCell = (date, index) => {
    let { renderHeader, getNow } = this.props

    return renderHeader({
      date,
      key: `header_${index}`,
      className: cn(
        'rbc-date-cell',
        dates.eq(date, getNow(), 'day') && 'rbc-now'
      ),
    })
  }

  renderDummy = style => {
    let { className, range, renderHeader } = this.props
    return (
      <div className={className} style={style}>
        <div className="rbc-row-content">
          {renderHeader && (
            <div className="rbc-row" ref={this.createHeadingRef}>
              {range.map(this.renderHeadingCell)}
            </div>
          )}
          <div className="rbc-row" ref={this.createEventRef}>
            <div className="rbc-row-segment">
              <div className="rbc-event">
                <div className="rbc-event-content">&nbsp;</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const {
      date,
      rtl,
      events,
      range,
      className,
      selectable,
      dayPropGetter,
      renderForMeasure,
      startAccessor,
      endAccessor,
      getNow,
      renderHeader,
      dateCellWrapperComponent,
      eventComponent,
      eventWrapperComponent,
      onSelectStart,
      onSelectEnd,
      longPressThreshold,
      hideOverlay,
      style,
      ...props
    } = this.props

    if (renderForMeasure) return this.renderDummy(style)

    let { first, last } = endOfRange(range)

    let segments = (this.segments = events.map(evt =>
      eventSegments(
        evt,
        first,
        last,
        {
          startAccessor,
          endAccessor,
        },
        range
      )
    ))

    const { spanningEvents, dailyEvents } = eventLevelsBySpanning(
      segments,
      this.props
    )

    return (
      <div className={className} style={style}>
        <BackgroundCells
          date={date}
          getNow={getNow}
          rtl={rtl}
          range={range}
          selectable={selectable}
          container={this.getContainer}
          dayPropGetter={dayPropGetter}
          onSelectStart={onSelectStart}
          onSelectEnd={onSelectEnd}
          onSelectSlot={this.handleSelectSlot}
          cellWrapperComponent={dateCellWrapperComponent}
          longPressThreshold={longPressThreshold}
          enableOffRange={false}
        />

        <div className="rbc-row-content">
          {renderHeader && (
            <div className="rbc-row" ref={this.createHeadingRef}>
              {range.map(this.renderHeadingCell)}
            </div>
          )}
          <div className="rbc-spanning-events-row">
            {spanningEvents.map((segs, idx) => (
              <EventRow
                {...props}
                key={idx}
                start={first}
                end={last}
                segments={segs}
                slots={range.length}
                eventComponent={eventComponent}
                eventWrapperComponent={eventWrapperComponent}
                startAccessor={startAccessor}
                endAccessor={endAccessor}
                hideOverlay={hideOverlay}
              />
            ))}
          </div>
          <DailyEventRow
            {...props}
            start={first}
            end={last}
            eventGroup={dailyEvents}
            slots={range.length}
            eventComponent={eventComponent}
            eventWrapperComponent={eventWrapperComponent}
            startAccessor={startAccessor}
            endAccessor={endAccessor}
            hideOverlay={hideOverlay}
          />
        </div>
      </div>
    )
  }
}

VarHeightDateContentRow.propTypes = propTypes
VarHeightDateContentRow.defaultProps = defaultProps

export default VarHeightDateContentRow
