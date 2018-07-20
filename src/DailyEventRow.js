import PropTypes from 'prop-types'
import React from 'react'
import EventRowMixin from './EventRowMixin'

class DailyEventRow extends React.Component {
  static propTypes = {
    eventGroup: PropTypes.array,
    ...EventRowMixin.propTypes,
  }
  static defaultProps = {
    ...EventRowMixin.defaultProps,
  }
  render() {
    let { eventGroup, slots } = this.props

    let lastEnd = 1

    return (
      <div className="rbc-row rbc-daily-events-row">
        {eventGroup.reduce((row, events, li) => {
          let key = '_lvl_' + li
          let gap = events[0].left - lastEnd

          if (gap) row.push(EventRowMixin.renderSpan(slots, gap, `${key}_gap`))

          let content = (
            <div className="rbc-daily-events">
              {events.map((evt, ev_idx) => {
                return EventRowMixin.renderEvent(
                  this.props,
                  evt.event,
                  `ec_${ev_idx}`
                )
              })}
            </div>
          )

          row.push(EventRowMixin.renderSpan(slots, 1, key, content))

          lastEnd = events[0].right + 1

          return row
        }, [])}
      </div>
    )
  }
}

export default DailyEventRow
