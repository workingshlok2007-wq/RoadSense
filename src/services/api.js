import { reports } from '../data/mockData'
const wait = (value, delay=350) => new Promise(resolve => setTimeout(()=>resolve(structuredClone(value)),delay))
export const api = {
  getReports: () => wait(reports),
  submitReport: report => wait(report, 500),
  updateReport: report => wait(report, 400),
}
