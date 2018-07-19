import { views } from './utils/constants'
import Month from './Month'
import InfiniteMonth from './InfiniteMonth'
import Day from './Day'
import Week from './Week'
import WorkWeek from './WorkWeek'
import Agenda from './Agenda'

const VIEWS = {
  [views.MONTH]: Month,
  [views.WEEK]: Week,
  [views.WORK_WEEK]: WorkWeek,
  [views.DAY]: Day,
  [views.AGENDA]: Agenda,
  [views.INFINITE_MONTH]: InfiniteMonth,
}

export default VIEWS
