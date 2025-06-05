/**
 * SQL验证器
 * 提供SQL语句的安全性验证功能
 */

class SQLValidator {
    constructor() {
      // 危险关键词列表
      this.dangerousKeywords = [
        'drop table', 'drop database', 'truncate',
        'alter table', 'create database', 'drop index',
        'create user', 'drop user', 'grant', 'revoke',
        'load_file', 'into outfile', 'into dumpfile',
        'exec', 'execute', 'sp_', 'xp_'
      ];
      
      // 允许的操作类型
      this.allowedOperations = ['select', 'insert', 'update', 'delete'];
    }
  
    /**
     * 验证SQL语句的安全性
     * @param {string} sql - 要验证的SQL语句
     * @returns {Object} 验证结果
     */
    validateSQL(sql) {
      if (!sql || typeof sql !== 'string') {
        return {
          isValid: false,
          error: 'SQL语句不能为空且必须是字符串'
        };
      }
  
      const cleanSQL = sql.toLowerCase().trim();
      
      // 检查是否包含危险关键词
      for (const keyword of this.dangerousKeywords) {
        if (cleanSQL.includes(keyword)) {
          return {
            isValid: false,
            error: `检测到危险操作: ${keyword}`
          };
        }
      }
  
      // 检查是否是允许的操作
      const operation = this.getOperationType(cleanSQL);
      if (!this.allowedOperations.includes(operation)) {
        return {
          isValid: false,
          error: `不支持的操作类型: ${operation}`
        };
      }
  
      // 检查SQL注入风险
      const injectionCheck = this.checkSQLInjection(cleanSQL);
      if (!injectionCheck.isValid) {
        return injectionCheck;
      }
  
      return {
        isValid: true,
        operation: operation
      };
    }
  
    /**
     * 获取SQL操作类型
     * @param {string} sql - SQL语句
     * @returns {string} 操作类型
     */
    getOperationType(sql) {
      const trimmed = sql.trim();
      if (trimmed.startsWith('select')) return 'select';
      if (trimmed.startsWith('insert')) return 'insert';
      if (trimmed.startsWith('update')) return 'update';
      if (trimmed.startsWith('delete')) return 'delete';
      return 'unknown';
    }
  
    /**
     * 检查SQL注入风险
     * @param {string} sql - SQL语句
     * @returns {Object} 检查结果
     */
    checkSQLInjection(sql) {
      // 检查常见的SQL注入模式
      const injectionPatterns = [
        /union\s+select/i,
        /;\s*(drop|delete|update|insert)/i,
        /--\s*$/,
        /\/\*.*?\*\//,
        /'.*?'.*?or.*?'.*?'=/i,
        /".*?".*?or.*?".*?"=/i
      ];
  
      for (const pattern of injectionPatterns) {
        if (pattern.test(sql)) {
          return {
            isValid: false,
            error: '检测到潜在的SQL注入风险'
          };
        }
      }
  
      return { isValid: true };
    }
  
    /**
     * 验证查询参数
     * @param {Array} params - 查询参数
     * @returns {Object} 验证结果
     */
    validateParams(params) {
      if (!Array.isArray(params)) {
        return {
          isValid: false,
          error: '参数必须是数组格式'
        };
      }
  
      // 检查参数数量限制
      if (params.length > 100) {
        return {
          isValid: false,
          error: '参数数量不能超过100个'
        };
      }
  
      return { isValid: true };
    }
  }
  
  module.exports = SQLValidator;