import findIndex from 'lodash/findIndex'
import dates from './dates'
import groupBy from 'lodash/groupBy'
import map from 'lodash/map'
import { accessor as get } from './accessors'

export function endOfRange(dateRange, unit = 'day') {
  return {
    first: dateRange[0],
    last: dates.add(dateRange[dateRange.length - 1], 1, unit),
  }
}

export function eventSegments(
  event,
  first,
  last,
  { startAccessor, endAccessor },
  range
) {
  // how many days
  let slots = dates.diff(first, last, 'day')
  // find either start of week or start of event, whichever is later
  let start = dates.max(dates.startOf(get(event, startAccessor), 'day'), first)
  let end = dates.min(dates.ceil(get(event, endAccessor), 'day'), last)

  let padding = findIndex(range, x => dates.eq(x, start, 'day'))
  // how wide is the event
  let span = dates.diff(start, end, 'day')

  // clamp event to [1,num_days]
  span = Math.min(span, slots)
  span = Math.max(span, 1)

  return {
    event,
    span,
    left: padding + 1,
    right: Math.max(padding + span, 1),
  }
}

export function eventLevels(rowSegments, limit = Infinity) {
  let i,
    j,
    seg,
    levels = [],
    extra = []

  for (i = 0; i < rowSegments.length; i++) {
    seg = rowSegments[i]

    // loop until we find a level with no overlapping events
    for (j = 0; j < levels.length; j++) {
      if (!segsOverlap(seg, levels[j])) {
        break
      }
    }

    // extras just contains events that won't fit in existing layers if we
    // already have the max
    if (j >= limit) {
      extra.push(seg)
    } else {
      // add a new layer or add the event to the existing layer
      ;(levels[j] || (levels[j] = [])).push(seg)
    }
  }

  for (i = 0; i < levels.length; i++) {
    // sort the events from left to right
    levels[i].sort((a, b) => a.left - b.left) //eslint-disable-line
  }

  return { levels, extra }
}

export function eventLevelsBySpanning(
  rowSegments,
  { startAccessor, endAccessor }
) {
  const spanning = seg => {
    const start = dates.startOf(get(seg.event, startAccessor), 'day')
    const end = dates.ceil(get(seg.event, endAccessor), 'day')

    return dates.diff(end, start, 'day') > 1
  }

  const notSpanning = seg => !spanning(seg)

  let spanningEvents = rowSegments
    .filter(spanning)
    .sort((a, b) => a.left - b.left)
  spanningEvents = eventLevels(spanningEvents).levels

  let dailyEvents = rowSegments.filter(notSpanning)
  dailyEvents = groupBy(dailyEvents, seg =>
    dates.startOf(get(seg.event, startAccessor), 'day')
  )

  dailyEvents = map(dailyEvents, events =>
    events.sort((a, b) => a.left - b.left)
  )

  return {
    spanningEvents,
    dailyEvents,
  }
}

export function inRange(e, start, end, { startAccessor, endAccessor }) {
  let eStart = dates.startOf(get(e, startAccessor), 'day')
  let eEnd = get(e, endAccessor)

  let startsBeforeEnd = dates.lte(eStart, end, 'day')
  // when the event is zero duration we need to handle a bit differently
  let endsAfterStart = !dates.eq(eStart, eEnd, 'minutes')
    ? dates.gt(eEnd, start, 'minutes')
    : dates.gte(eEnd, start, 'minutes')

  return startsBeforeEnd && endsAfterStart
}

export function segsOverlap(seg, otherSegs) {
  return otherSegs.some(
    otherSeg => otherSeg.left <= seg.right && otherSeg.right >= seg.left
  )
}

export function sortEvents(
  evtA,
  evtB,
  { startAccessor, endAccessor, allDayAccessor }
) {
  let startSort =
    +dates.startOf(get(evtA, startAccessor), 'day') -
    +dates.startOf(get(evtB, startAccessor), 'day')

  let durA = dates.diff(
    get(evtA, startAccessor),
    dates.ceil(get(evtA, endAccessor), 'day'),
    'day'
  )

  let durB = dates.diff(
    get(evtB, startAccessor),
    dates.ceil(get(evtB, endAccessor), 'day'),
    'day'
  )

  return (
    startSort || // sort by start Day first
    Math.max(durB, 1) - Math.max(durA, 1) || // events spanning multiple days go first
    !!get(evtB, allDayAccessor) - !!get(evtA, allDayAccessor) || // then allDay single day events
    +get(evtA, startAccessor) - +get(evtB, startAccessor)
  ) // then sort by start time
}
