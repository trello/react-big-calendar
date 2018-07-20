import PropTypes from 'prop-types'
import React from 'react'
import { findDOMNode } from 'react-dom'
import cn from 'classnames'

import dates from './utils/dates'
import localizer from './localizer'
import chunk from 'lodash/chunk'

import { navigate, views } from './utils/constants'
import { notify } from './utils/helpers'
import getPosition from 'dom-helpers/query/position'
import raf from 'dom-helpers/util/requestAnimationFrame'

import Popup from './Popup'
import Overlay from 'react-overlays/lib/Overlay'
import VarHeightDateContentRow from './VarHeightDateContentRow'
import Header from './Header'
import DateHeader from './DateHeader'

import { accessor, dateFormat } from './utils/propTypes'
import { inRange, sortEvents } from './utils/eventLevels'
import { List, AutoSizer, InfiniteLoader } from 'react-virtualized'

let eventsForWeek = (evts, start, end, props) =>
  evts.filter(e => inRange(e, start, end, props))

let propTypes = {
  events: PropTypes.array.isRequired,
  date: PropTypes.instanceOf(Date),

  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),

  step: PropTypes.number,
  getNow: PropTypes.func.isRequired,

  scrollToTime: PropTypes.instanceOf(Date),
  eventPropGetter: PropTypes.func,
  dayPropGetter: PropTypes.func,

  culture: PropTypes.string,
  dayFormat: dateFormat,

  rtl: PropTypes.bool,
  width: PropTypes.number,

  titleAccessor: accessor.isRequired,
  tooltipAccessor: accessor.isRequired,
  allDayAccessor: accessor.isRequired,
  startAccessor: accessor.isRequired,
  endAccessor: accessor.isRequired,

  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,

  onNavigate: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEvent: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onShowMore: PropTypes.func,
  onDrillDown: PropTypes.func,
  onHideOverlay: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,

  dateFormat,

  weekdayFormat: dateFormat,
  popup: PropTypes.bool,

  messages: PropTypes.object,
  components: PropTypes.object.isRequired,
  popupOffset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ]),
}

class InfiniteMonthView extends React.Component {
  static displayName = 'InfiniteMonthView'
  static propTypes = propTypes

  constructor(...args) {
    super(...args)

    this._bgRows = []
    this._pendingSelection = []
    this._weeks = {}
    this._slotRows = {}
    this._slotRowFuns = {}
    this.state = {
      rowLimit: 5,
      needLimitMeasure: true,
    }

    //this.renderWeek = this.renderWeek.bind(this);
    //this.renderRow = this.renderRow.bind(this);
    //this.getSlotRowRef = this.getSlotRowRef.bind(this);
  }

  componentWillReceiveProps({ date }) {
    this.setState({
      needLimitMeasure: !dates.eq(date, this.props.date),
    })
  }

  componentDidMount() {
    let running

    setTimeout(() => {
      // Delay this to the next tic to make sure the DOM can be measured
      if (this.state.needLimitMeasure) this.measureRowLimit(this.props)
    }, 0)

    window.addEventListener(
      'resize',
      (this._resizeListener = () => {
        if (!running) {
          raf(() => {
            running = false
            this.setState({ needLimitMeasure: true }) //eslint-disable-line
          })
        }
      }),
      false
    )
  }

  componentDidUpdate(prevProps) {
    if (this.state.needLimitMeasure) this.measureRowLimit(this.props)
    if (this.props.date !== prevProps.date) this.hideOverlay()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resizeListener, false)
  }

  getContainer = () => {
    return findDOMNode(this)
  }

  render() {
    let { culture, weekdayFormat, className } = this.props

    this.loadMoreRows({ startIndex: 0, stopIndex: 20 })
    this.loadMoreRows({ startIndex: 5200 - 5, stopIndex: 5200 + 20 })

    return (
      <div className={cn('rbc-month-view', className)}>
        <div className="rbc-row rbc-month-header">
          {this.renderHeaders(this._weeks[0], weekdayFormat, culture)}
        </div>
        <div style={{ height: '100%' }}>
          <AutoSizer>
            {({ height, width }) => (
              <InfiniteLoader
                isRowLoaded={this.isRowLoaded}
                loadMoreRows={this.loadMoreRows}
                rowCount={10400}
              >
                {({ onRowsRendered, registerChild }) => (
                  <List
                    ref={registerChild}
                    onRowsRendered={onRowsRendered}
                    width={width}
                    height={height}
                    rowCount={10400}
                    rowHeight={height / 6}
                    rowRenderer={this.renderRow}
                    scrollToIndex={5202}
                    needLimitMeasure={this.state.needLimitMeasure}
                  />
                )}
              </InfiniteLoader>
            )}
          </AutoSizer>
        </div>
        {this.props.popup && this.renderOverlay()}
      </div>
    )
  }

  isRowLoaded = ({ index }) => !!this._weeks[index]

  loadMoreRows = ({ startIndex, stopIndex }) => {
    let allLoaded = true
    for (let i = startIndex; i <= stopIndex; i++) {
      allLoaded = allLoaded && this.isRowLoaded({ index: i })
    }

    if (allLoaded) return

    const startOffset = (startIndex - 5200) * 7,
      endOffset = (stopIndex - 5200) * 7,
      weekStart = dates.startOf(
        this.props.date,
        'week',
        localizer.startOfWeek(this.props.culture)
      ),
      weekEnd = dates.endOf(
        this.props.date,
        'week',
        localizer.startOfWeek(this.props.culture)
      ),
      startDate = dates.add(weekStart, startOffset, 'day'),
      endDate = dates.add(weekEnd, endOffset, 'day'),
      span = dates.range(startDate, endDate, this.props.culture),
      weeks = chunk(span, 7)

    for (let i = startIndex; i <= stopIndex; i++) {
      this._weeks[i] = weeks[i - startIndex]
    }
  }

  renderRow = ({ key, index, style }) => {
    this.loadMoreRows({ startIndex: index, stopIndex: index })
    return this.renderWeek(this._weeks[index], index, key, style)
  }

  renderWeek = (week, weekIdx, key, style) => {
    let {
      events,
      components,
      selectable,
      titleAccessor,
      tooltipAccessor,
      startAccessor,
      endAccessor,
      allDayAccessor,
      getNow,
      eventPropGetter,
      dayPropGetter,
      messages,
      selected,
      date,
      longPressThreshold,
    } = this.props

    const { needLimitMeasure, rowLimit } = this.state

    events = eventsForWeek(events, week[0], week[week.length - 1], this.props)
    events.sort((a, b) => sortEvents(a, b, this.props))

    //const ContentRow = false ? DateContentRow : VarHeightDateContentRow
    return (
      <VarHeightDateContentRow
        key={key}
        ref={this.getSlotRowRef(weekIdx)}
        container={this.getContainer}
        className="rbc-month-row"
        getNow={getNow}
        date={date}
        range={week}
        events={events}
        maxRows={rowLimit}
        selected={selected}
        selectable={selectable}
        messages={messages}
        titleAccessor={titleAccessor}
        tooltipAccessor={tooltipAccessor}
        startAccessor={startAccessor}
        endAccessor={endAccessor}
        allDayAccessor={allDayAccessor}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        renderHeader={this.readerDateHeading}
        renderForMeasure={needLimitMeasure}
        onShowMore={this.handleShowMore}
        onSelect={this.handleSelectEvent}
        onDoubleClick={this.handleDoubleClickEvent}
        onSelectSlot={this.handleSelectSlot}
        eventComponent={components.event}
        eventWrapperComponent={components.eventWrapper}
        dateCellWrapperComponent={components.dateCellWrapper}
        longPressThreshold={longPressThreshold}
        hideOverlay={this.hideOverlay.bind(this)}
        style={style}
      />
    )
  }

  getSlotRowRef = idx => {
    if (!this._slotRowFuns[idx]) {
      this._slotRowFuns[idx] = ref => {
        if (ref == null) {
          delete this._slotRows[idx]
          delete this._slotRowFuns[idx]
        } else {
          this._slotRows[idx] = ref
        }
      }
    }

    return this._slotRowFuns[idx]
  }

  readerDateHeading = ({ date, className, ...props }) => {
    let {
      date: currentDate,
      getDrilldownView,
      dateFormat,
      culture,
    } = this.props

    let isCurrent = dates.eq(date, currentDate, 'day')
    let drilldownView = getDrilldownView(date)
    let isFirstOfMonth = date.getDate() == 1
    dateFormat = isFirstOfMonth ? 'MMM D' : dateFormat
    let label = localizer.format(date, dateFormat, culture)
    let style = isFirstOfMonth ? { fontWeight: 'bold' } : undefined
    let DateHeaderComponent = this.props.components.dateHeader || DateHeader

    return (
      <div {...props} className={cn(className, isCurrent && 'rbc-current')}>
        <DateHeaderComponent
          label={label}
          style={style}
          date={date}
          drilldownView={drilldownView}
          isOffRange={false}
          onDrillDown={e => this.handleHeadingClick(date, drilldownView, e)}
        />
      </div>
    )
  }

  renderHeaders(row, format, culture) {
    let first = row[0]
    let last = row[row.length - 1]
    let HeaderComponent = this.props.components.header || Header

    return dates.range(first, last, 'day').map((day, idx) => (
      <div key={'header_' + idx} className="rbc-header">
        <HeaderComponent
          date={day}
          label={localizer.format(day, format, culture)}
          localizer={localizer}
          format={format}
          culture={culture}
        />
      </div>
    ))
  }

  hideOverlay() {
    // These updates have to be deferred because they're called in a render
    setTimeout(() => {
      this.setState({ overlay: null })
      this.props.onHideOverlay()
    }, 0)
  }

  renderOverlay() {
    let overlay = (this.state && this.state.overlay) || {}
    let { components } = this.props

    return (
      <Overlay
        rootClose
        placement="bottom"
        container={this}
        show={!!overlay.position}
        onHide={this.hideOverlay.bind(this)}
      >
        <Popup
          {...this.props}
          eventComponent={components.event}
          eventWrapperComponent={components.eventWrapper}
          position={overlay.position}
          events={overlay.events}
          slotStart={overlay.date}
          slotEnd={overlay.end}
          onSelect={this.handleSelectEvent}
          onDoubleClick={this.handleDoubleClickEvent}
          hideOverlay={this.hideOverlay.bind(this)}
        />
      </Overlay>
    )
  }

  measureRowLimit() {
    if (!this._slotRows) {
      return
    }

    const refKey = Object.keys(this._slotRows)[0]
    const slotRow = this._slotRows[refKey]

    this.setState({
      needLimitMeasure: false,
      rowLimit: slotRow.getRowLimit(),
    })
  }

  handleSelectSlot = (range, slotInfo) => {
    this._pendingSelection = this._pendingSelection.concat(range)

    clearTimeout(this._selectTimer)
    this._selectTimer = setTimeout(() => this.selectDates(slotInfo))
  }

  handleHeadingClick = (date, view, e) => {
    e.preventDefault()
    this.clearSelection()
    notify(this.props.onDrillDown, [date, view])
  }

  handleSelectEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onSelectEvent, args)
  }

  handleDoubleClickEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onDoubleClickEvent, args)
  }

  handleShowMore = (events, date, cell, slot) => {
    const { popup, onDrillDown, onShowMore, getDrilldownView } = this.props
    //cancel any pending selections so only the event click goes through.
    this.clearSelection()

    if (popup) {
      let position = getPosition(cell, findDOMNode(this))

      this.setState({
        overlay: { date, events, position },
      })
    } else {
      notify(onDrillDown, [date, getDrilldownView(date) || views.DAY])
    }

    notify(onShowMore, [events, date, slot])
  }

  selectDates(slotInfo) {
    let slots = this._pendingSelection.slice()

    this._pendingSelection = []

    slots.sort((a, b) => +a - +b)

    notify(this.props.onSelectSlot, {
      slots,
      start: slots[0],
      end: slots[slots.length - 1],
      action: slotInfo.action,
      box: slotInfo.box,
    })
  }

  clearSelection() {
    clearTimeout(this._selectTimer)
    this._pendingSelection = []
  }
}

InfiniteMonthView.range = (date, { culture }) => {
  let start = dates.firstVisibleDay(date, culture)
  let end = dates.lastVisibleDay(date, culture)
  return { start, end }
}

InfiniteMonthView.navigate = (date, action) => {
  switch (action) {
    case navigate.PREVIOUS:
      return dates.add(date, -1, 'month')

    case navigate.NEXT:
      return dates.add(date, 1, 'month')

    default:
      return date
  }
}

InfiniteMonthView.title = (date, { formats, culture }) =>
  localizer.format(date, formats.monthHeaderFormat, culture)

export default InfiniteMonthView
