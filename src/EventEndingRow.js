import PropTypes from 'prop-types'
import React from 'react'
import EventRowMixin from './EventRowMixin'
import { eventLevels } from './utils/eventLevels'
import message from './utils/messages'

let isSegmentInSlot = (seg, slot) => seg.left <= slot && seg.right >= slot
let eventsInSlot = (segments, slot) =>
  segments.filter(seg => isSegmentInSlot(seg, slot)).length

class EventEndingRow extends React.Component {
  static propTypes = {
    segments: PropTypes.array,
    slots: PropTypes.number,
    messages: PropTypes.object,
    onShowMore: PropTypes.func,
    ...EventRowMixin.propTypes,
  }
  static defaultProps = {
    ...EventRowMixin.defaultProps,
  }

  render() {
    let { segments, slots: slotCount } = this.props
    let rowSegments = eventLevels(segments).levels[0]

    let current = 1,
      lastEnd = 1,
      row = []

    while (current <= slotCount) {
      let key = '_lvl_' + current

      let { event, left } =
        rowSegments.filter(seg => isSegmentInSlot(seg, current))[0] || {} //eslint-disable-line

      if (!event) {
        current++
        continue
      }

      let gap = Math.max(0, left - lastEnd)

      if (gap) {
        row.push(EventRowMixin.renderSpan(slotCount, gap, key + '_gap'))
      }

      row.push(
        EventRowMixin.renderSpan(
          slotCount,
          1,
          key,
          this.renderShowMore(segments, current)
        )
      )
      lastEnd = current = current + 1
    }

    return <div className="rbc-row">{row}</div>
  }

  renderShowMore(segments, slot) {
    let messages = message(this.props.messages)
    let count = eventsInSlot(segments, slot)

    return count ? (
      <a
        key={'sm_' + slot}
        href="#"
        className={'rbc-show-more'}
        onClick={e => this.showMore(slot, e)}
      >
        {messages.showMore(count)}
      </a>
    ) : (
      false
    )
  }

  showMore(slot, e) {
    e.preventDefault()
    this.props.onShowMore(slot)
  }
}

export default EventEndingRow
