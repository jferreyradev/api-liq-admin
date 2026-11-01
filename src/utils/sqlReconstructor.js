/**
 * Reconstruye una sentencia SQL compatible con Oracle 11g a partir
 * de la configuración JSON de una vista de la API (API_VIEW_MAPPER).
 */
export function buildSqlFromViewConfig(config) {
  if (!config) return '';
  if (config.rawSql) return config.rawSql;
  if (config.sqlQuery) return config.sqlQuery;

  const fields = config.fields || {};
  const fieldEntries = Object.entries(fields);
  let sql = 'SELECT\n';

  if (fieldEntries.length === 0) {
    sql += '    *\n';
  } else {
    const fieldLines = fieldEntries.map(([alias, expr]) => {
      const cleanExpr = String(expr || '').trim();
      const cleanAlias = String(alias || '').trim();
      if (!cleanExpr || cleanExpr.toLowerCase() === cleanAlias.toLowerCase() || cleanExpr.endsWith('.' + cleanAlias)) {
        return '    ' + (cleanExpr || cleanAlias);
      }
      return '    ' + cleanExpr + ' AS ' + cleanAlias;
    });
    sql += fieldLines.join(',\n') + '\n';
  }

  const fromClause = Array.isArray(config.sql?.fromClause)
    ? config.sql.fromClause
    : (config.sql?.fromClause ? [config.sql.fromClause] : []);

  if (fromClause.length > 0) {
    fromClause.forEach((line, idx) => {
      const trimmed = String(line || '').trim();
      if (idx === 0 && !trimmed.toUpperCase().startsWith('FROM')) {
        sql += 'FROM ' + trimmed + '\n';
      } else {
        sql += trimmed + '\n';
      }
    });
  }

  const whereFields = config.sql?.whereFields || {};
  const whereEntries = Object.entries(whereFields);
  if (whereEntries.length > 0) {
    sql += 'WHERE\n';
    const whereLines = whereEntries.map(([param, col]) => String(col || '').trim() + ' = :' + String(param || '').trim());
    sql += '    ' + whereLines.join('\n    AND ') + '\n';
  }

  const groupClause = Array.isArray(config.sql?.groupClause)
    ? config.sql.groupClause
    : (config.sql?.groupClause ? [config.sql.groupClause] : []);
  if (groupClause.length > 0) {
    groupClause.forEach((line, idx) => {
      const trimmed = String(line || '').trim();
      if (idx === 0 && !trimmed.toUpperCase().startsWith('GROUP BY')) {
        sql += 'GROUP BY ' + trimmed + '\n';
      } else {
        sql += trimmed + '\n';
      }
    });
  }

  return sql.trim();
}
