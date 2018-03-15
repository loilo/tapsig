import debug from 'debug'
const log = debug('tapsig')

/**
 * Debugging log for Node.js
 */
export default (_, ...args) => log(...args)
