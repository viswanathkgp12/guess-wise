import BigNumber from 'bignumber.js'

export { default as formatAddress } from './formatAddress'

export const bnToDec = (bn: BigNumber, decimals = 18): number => {
  return bn.dividedBy(new BigNumber(10).pow(decimals)).toNumber()
}

export const decToBn = (dec: number, decimals = 18) => {
  return new BigNumber(dec).multipliedBy(new BigNumber(10).pow(decimals))
}

export const unixToDate = (unixTimeStamp: number) => {
  const date = new Date(unixTimeStamp * 1000)
  const dateString =
    date.getDate() +
    ' ' +
    getMonthName(date.getMonth()) +
    ', ' +
    date.getFullYear() +
    ' ' +
    leftPadZeroes(date.getHours(), 2) +
    ':' +
    leftPadZeroes(date.getMinutes(), 2) +
    ' UTC'
  return dateString
}

function getMonthName(monthNumber: number) {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return monthNames[monthNumber]
}

const leftPadZeroes = (num: number, places: number) =>
  String(num).padStart(places, '0')
