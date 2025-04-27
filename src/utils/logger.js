/**
 * Logger utility for sRAG system
 * Fallout Vault-Tec themed RAG implementation
 */

/**
 * Simple logger implementation
 */
class Logger {
  /**
   * Create a new Logger
   * @param {Object} options - Logger options
   */
  constructor(options = {}) {
    this.name = options.name || 'Default';
    this.level = options.level || 'info';
    this.parent = options.parent || null;
    
    // Define log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Vault-Tec themed log prefix
    this.prefix = options.prefix || '[VAULT-TEC]';
  }
  
  /**
   * Create a child logger with a new name
   * @param {string} name - Child logger name
   * @returns {Logger} - Child logger
   */
  child(name) {
    return new Logger({
      name: `${this.name}:${name}`,
      level: this.level,
      parent: this,
      prefix: this.prefix
    });
  }
  
  /**
   * Log an error message
   * @param {string} message - Message to log
   */
  error(message) {
    this.log('error', message);
  }
  
  /**
   * Log a warning message
   * @param {string} message - Message to log
   */
  warn(message) {
    this.log('warn', message);
  }
  
  /**
   * Log an info message
   * @param {string} message - Message to log
   */
  info(message) {
    this.log('info', message);
  }
  
  /**
   * Log a debug message
   * @param {string} message - Message to log
   */
  debug(message) {
    this.log('debug', message);
  }
  
  /**
   * Log a message at a specific level
   * @param {string} level - Log level
   * @param {string} message - Message to log
   */
  log(level, message) {
    // Skip if level is higher than current level
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${this.prefix} [${level.toUpperCase()}] [${this.name}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'debug':
        console.log(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}

// Create default logger
const defaultLogger = new Logger({
  name: 'SRAG',
  level: process.env.LOG_LEVEL || 'info',
  prefix: process.env.NODE_ENV === 'production' ? '[VAULT-TEC]' : '[VAULT-TEC-DEV]'
});

module.exports = {
  Logger,
  defaultLogger
};