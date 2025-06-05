/**
 * 数据库连接和操作模块
 * 负责MySQL数据库的连接、查询执行等功能
 */

const mysql = require('mysql2/promise');
const config = require('./config');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * 初始化数据库连接池
   */
  async initialize() {
    try {
      this.pool = mysql.createPool({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database,
        connectionLimit: config.database.connectionLimit,
        acquireTimeout: config.database.acquireTimeout,
        timeout: config.database.timeout,
        reconnect: config.database.reconnect,
        multipleStatements: false // 禁用多语句执行以提高安全性
      });

      // 测试连接
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      this.isConnected = true;
      console.log('✓ 数据库连接成功');
    } catch (error) {
      console.error('✗ 数据库连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行SQL查询
   * @param {string} sql - SQL语句
   * @param {Array} params - 查询参数
   * @returns {Object} 查询结果
   */
  async executeQuery(sql, params = []) {
    if (!this.isConnected) {
      throw new Error('数据库未连接');
    }

    let connection;
    try {
      connection = await this.pool.getConnection();
      
      const startTime = Date.now();
      const [rows, fields] = await connection.execute(sql, params);
      const executionTime = Date.now() - startTime;

      // 根据操作类型返回不同的结果格式
      const operation = this.getOperationType(sql);
      
      return {
        success: true,
        operation: operation,
        data: rows,
        fields: fields ? fields.map(f => ({
          name: f.name,
          type: f.type,
          length: f.length
        })) : [],
        rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows || 0,
        executionTime: executionTime,
        insertId: rows.insertId || null
      };
    } catch (error) {
      console.error('SQL执行错误:', error.message);
      return {
        success: false,
        error: error.message,
        sqlState: error.sqlState || null,
        errno: error.errno || null
      };
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 获取数据库表信息
   * @returns {Object} 表信息
   */
  async getTablesInfo() {
    try {
      const tablesResult = await this.executeQuery('SHOW TABLES');
      if (!tablesResult.success) {
        return tablesResult;
      }

      const tables = [];
      for (const row of tablesResult.data) {
        const tableName = Object.values(row)[0];
        
        // 获取表结构
        const structureResult = await this.executeQuery(`DESCRIBE ${tableName}`);
        if (structureResult.success) {
          tables.push({
            name: tableName,
            columns: structureResult.data
          });
        }
      }

      return {
        success: true,
        data: tables
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取SQL操作类型
   * @param {string} sql - SQL语句
   * @returns {string} 操作类型
   */
  getOperationType(sql) {
    const trimmed = sql.toLowerCase().trim();
    if (trimmed.startsWith('select')) return 'SELECT';
    if (trimmed.startsWith('insert')) return 'INSERT';
    if (trimmed.startsWith('update')) return 'UPDATE';
    if (trimmed.startsWith('delete')) return 'DELETE';
    return 'UNKNOWN';
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('✓ 数据库连接已关闭');
    }
  }

  /**
   * 获取连接状态
   * @returns {boolean} 连接状态
   */
  isConnectionActive() {
    return this.isConnected;
  }
}

module.exports = DatabaseManager;