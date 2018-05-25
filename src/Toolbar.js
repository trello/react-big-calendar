import PropTypes from 'prop-types'
import React from 'react'
import cn from 'classnames'
import { navigate } from './utils/constants'

class Toolbar extends React.Component {
  static propTypes = {
    view: PropTypes.string.isRequired,
    views: PropTypes.arrayOf(PropTypes.string).isRequired,
    label: PropTypes.node.isRequired,
    messages: PropTypes.object,
    onNavigate: PropTypes.func.isRequired,
    onViewChange: PropTypes.func.isRequired,
  }

  render() {
    let { messages, label } = this.props

    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button
            className="rbc-btn-nav rbc-btn-today"
            type="button"
            onClick={this.navigate.bind(null, navigate.TODAY)}
          >
            {messages.today}
          </button>
          <button
            className="rbc-btn-nav rbc-btn-nav-prev"
            type="button"
            onClick={this.navigate.bind(null, navigate.PREVIOUS)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <g
                id="left-caret"
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
              >
                <g
                  id="caret"
                  transform="translate(11.000000, 12.000000) scale(-1, 1) translate(-11.000000, -12.000000) translate(6.000000, 4.000000)"
                  fill="#959DA1"
                  fillRule="nonzero"
                >
                  <path
                    d="M4.9988896,9.8053477 L-1.30004008,3.7904958 C-1.68950573,3.4185948 -2.32029347,3.41922717 -2.70894393,3.79190824 C-3.09759439,4.16458931 -3.09693354,4.76819234 -2.70746788,5.14009334 L5.0000426,12.5 L12.7080451,5.12755845 C13.0971924,4.75535237 13.0973367,4.15174903 12.7083674,3.77937264 C12.3193981,3.40699625 11.6886101,3.40685818 11.2994628,3.77906426 L4.9988896,9.8053477 Z"
                    id="Path-3"
                    transform="translate(5.000000, 8.000000) rotate(-90.000000) translate(-5.000000, -8.000000) "
                  />
                </g>
              </g>
            </svg>
          </button>
          <button
            className="rbc-btn-nav rbc-btn-nav-next"
            type="button"
            onClick={this.navigate.bind(null, navigate.NEXT)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <g
                id="right-caret"
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
              >
                <g
                  id="caret"
                  transform="translate(8.000000, 4.000000)"
                  fill="#959DA1"
                  fillRule="nonzero"
                >
                  <path
                    d="M4.9988896,9.8053477 L-1.30004008,3.7904958 C-1.68950573,3.4185948 -2.32029347,3.41922717 -2.70894393,3.79190824 C-3.09759439,4.16458931 -3.09693354,4.76819234 -2.70746788,5.14009334 L5.0000426,12.5 L12.7080451,5.12755845 C13.0971924,4.75535237 13.0973367,4.15174903 12.7083674,3.77937264 C12.3193981,3.40699625 11.6886101,3.40685818 11.2994628,3.77906426 L4.9988896,9.8053477 Z"
                    id="Path-3"
                    transform="translate(5.000000, 8.000000) rotate(-90.000000) translate(-5.000000, -8.000000) "
                  />
                </g>
              </g>
            </svg>
          </button>
        </span>

        <span className="rbc-toolbar-label">{label}</span>

        <span className="rbc-btn-group">{this.viewNamesGroup(messages)}</span>
      </div>
    )
  }

  navigate = action => {
    this.props.onNavigate(action)
  }

  view = view => {
    this.props.onViewChange(view)
  }

  viewNamesGroup(messages) {
    let viewNames = this.props.views
    const view = this.props.view

    if (viewNames.length > 1) {
      return viewNames.map(name => (
        <button
          type="button"
          key={name}
          className={cn({ 'rbc-active': view === name })}
          onClick={this.view.bind(null, name)}
        >
          {messages[name]}
        </button>
      ))
    }
  }
}

export default Toolbar
