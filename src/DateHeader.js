import PropTypes from 'prop-types'
import React from 'react'

const DateHeader = ({
  label,
  drilldownView,
  onDrillDown,
  style = undefined,
}) => {
  if (!drilldownView) {
    return <span style={style}>{label}</span>
  }

  return (
    <a href="#" onClick={onDrillDown} style={style}>
      {label}
    </a>
  )
}

DateHeader.propTypes = {
  label: PropTypes.node,
  date: PropTypes.instanceOf(Date),
  drilldownView: PropTypes.string,
  onDrillDown: PropTypes.func,
  isOffRange: PropTypes.bool,
}

export default DateHeader
