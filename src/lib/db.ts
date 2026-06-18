import { getCloudflareContext } from "@opennextjs/cloudflare";
import fs from "fs";
import path from "path";
import {
  SEED_USERS,
  SEED_BRANDS,
  SEED_INFLUENCERS,
  SEED_CAMPAIGNS,
  SEED_CAMPAIGN_INFLUENCERS,
  SEED_PAYMENTS,
  SEED_ACTIVITIES,
  SEED_NOTES
} from "./seed-data";

// Unified query parameters type
type QueryParams = (string | number | boolean | null)[];

// Unified database interface
export interface DBClient {
  query<T = any>(sql: string, params?: QueryParams): Promise<T[]>;
  execute(sql: string, params?: QueryParams): Promise<{ success: boolean; meta?: any }>;
}

// Local JSON Database Engine
const LOCAL_DB_PATH = path.join(process.cwd(), ".tmp", "db.json");

function ensureLocalDB() {
  const dir = path.dirname(LOCAL_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const initialData = {
      users: SEED_USERS,
      brands: [],
      influencers: [],
      influencer_categories: [],
      influencer_languages: [],
      influencer_documents: [],
      influencer_lists: [],
      influencer_list_members: [],
      campaigns: [],
      campaign_influencers: [],
      payments: [],
      activities: [],
      notes: [],
      reports: []
    };

    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
  }
}

function readLocalDB(): any {
  ensureLocalDB();
  return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf8"));
}

function writeLocalDB(data: any) {
  ensureLocalDB();
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

// Regex-based SQL evaluator for local JSON database
async function runLocalQuery(sql: string, params: QueryParams = []): Promise<any[]> {
  const db = readLocalDB();
  const cleanSql = sql.trim().replace(/\s+/g, " ");
  
  // 1. Handle SELECT queries
  const selectMatch = cleanSql.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
  if (selectMatch) {
    const [, fieldsStr, tableName, whereClause, orderByClause, limitStr] = selectMatch;
    const tableKey = tableName.toLowerCase();
    const table = db[tableKey] || [];
    
    let rows = [...table];

    // Filter using WHERE
    if (whereClause) {
      rows = filterRows(rows, whereClause, params);
    }

    // Sort using ORDER BY
    if (orderByClause) {
      const parts = orderByClause.trim().split(" ");
      const field = parts[0];
      const direction = parts[1]?.toLowerCase() === "desc" ? -1 : 1;
      rows.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;
        return valA > valB ? direction : -direction;
      });
    }

    // Limit rows
    if (limitStr) {
      const limit = parseInt(limitStr, 10);
      rows = rows.slice(0, limit);
    }

    // Select specific fields
    if (fieldsStr.trim() !== "*") {
      const fields = fieldsStr.split(",").map(f => f.trim().split(" as ").pop()!.split(".").pop()!.trim());
      rows = rows.map(row => {
        const selected: any = {};
        fields.forEach(f => {
          selected[f] = row[f];
        });
        return selected;
      });
    }

    return rows;
  }

  // 2. Handle INSERT queries
  const insertMatch = cleanSql.match(/^INSERT\s+INTO\s+(\w+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)$/i);
  if (insertMatch) {
    const [, tableName, colsStr, valsStr] = insertMatch;
    const tableKey = tableName.toLowerCase();
    const columns = colsStr.split(",").map(c => c.trim());
    
    const newRow: any = {};
    columns.forEach((col, idx) => {
      newRow[col] = params[idx] !== undefined ? params[idx] : null;
    });

    if (!db[tableKey]) db[tableKey] = [];
    db[tableKey].push(newRow);
    writeLocalDB(db);
    return [newRow];
  }

  // 3. Handle UPDATE queries
  const updateMatch = cleanSql.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?$/i);
  if (updateMatch) {
    const [, tableName, setStr, whereClause] = updateMatch;
    const tableKey = tableName.toLowerCase();
    const table = db[tableKey] || [];
    
    // Count how many placeholders are in the SET clause to split params correctly
    const setParamCount = (setStr.match(/\?/g) || []).length;
    const setParams = params.slice(0, setParamCount);
    const whereParams = params.slice(setParamCount);

    let updatedCount = 0;
    const updatedRows = table.map((row: any) => {
      // Check if row matches WHERE
      let match = true;
      if (whereClause) {
        const tempFiltered = filterRows([row], whereClause, whereParams);
        match = tempFiltered.length > 0;
      }

      if (match) {
        const updated = { ...row };
        let paramIdx = 0;
        setStr.split(",").forEach(pair => {
          const parts = pair.trim().split("=");
          if (parts.length < 2) return;
          const col = parts[0].trim();
          const valStr = parts[1].trim();

          if (valStr === "?") {
            updated[col] = setParams[paramIdx++];
          } else if (valStr === "CURRENT_TIMESTAMP") {
            updated[col] = new Date().toISOString();
          } else {
            updated[col] = valStr.replace(/^'|'$/g, "");
          }
        });
        updatedCount++;
        return updated;
      }
      return row;
    });

    db[tableKey] = updatedRows;
    writeLocalDB(db);
    return [{ updated: updatedCount }];
  }

  // 4. Handle DELETE queries
  const deleteMatch = cleanSql.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?$/i);
  if (deleteMatch) {
    const [, tableName, whereClause] = deleteMatch;
    const tableKey = tableName.toLowerCase();
    const table = db[tableKey] || [];

    let deletedCount = 0;
    const remainingRows = table.filter((row: any) => {
      let match = true;
      if (whereClause) {
        const tempFiltered = filterRows([row], whereClause, params);
        match = tempFiltered.length > 0;
      }
      if (match) {
        deletedCount++;
        return false; // exclude
      }
      return true; // keep
    });

    db[tableKey] = remainingRows;
    writeLocalDB(db);
    return [{ deleted: deletedCount }];
  }

  // Fallback for unhandled queries (return empty)
  console.warn("Local DB Engine: Unhandled query pattern:", cleanSql);
  return [];
}

// Helper to filter rows locally using WHERE expressions
function filterRows(rows: any[], whereClause: string, params: QueryParams): any[] {
  // Parse conditions like "email = ?", "id = ?", "col1 = ? AND col2 = ?"
  const conditions = whereClause.split(/\s+AND\s+/i);

  return rows.filter(row => {
    let paramIdx = 0;
    return conditions.every(cond => {
      const parts = cond.trim().split(/\s*(=|!=|LIKE|IN)\s*/i);
      if (parts.length < 3) return true;
      
      const rawField = parts[0].trim().split(".").pop()!; // Remove alias table prefix
      const op = parts[1].toUpperCase();
      const valPlaceholder = parts[2].trim();

      let val: any;
      if (valPlaceholder === "?") {
        val = params[paramIdx++];
      } else if (valPlaceholder.startsWith("'") && valPlaceholder.endsWith("'")) {
        val = valPlaceholder.slice(1, -1);
      } else {
        val = valPlaceholder;
      }

      const rowVal = row[rawField];

      if (op === "=") {
        return rowVal === val;
      }
      if (op === "!=") {
        return rowVal !== val;
      }
      if (op === "LIKE") {
        const pattern = String(val).toLowerCase().replace(/%/g, "");
        return String(rowVal).toLowerCase().includes(pattern);
      }
      if (op === "IN") {
        // If it is 'IN (?)' where parameter is array
        if (Array.isArray(val)) {
          return val.includes(rowVal);
        }
        return false;
      }
      return true;
    });
  });
}

// Unified Database Provider
export const db: DBClient = {
  async query<T = any>(sql: string, params: QueryParams = []): Promise<T[]> {
    try {
      const context = getCloudflareContext();
      const env = context?.env as any;
      if (env?.DB) {
        // Use Cloudflare D1
        const d1Db = env.DB;
        const result = await d1Db.prepare(sql).bind(...params).all();
        return (result.results || []) as T[];
      }
    } catch (e) {
      // Fallback to local file DB
    }
    return runLocalQuery(sql, params) as Promise<T[]>;
  },

  async execute(sql: string, params: QueryParams = []): Promise<{ success: boolean; meta?: any }> {
    try {
      const context = getCloudflareContext();
      const env = context?.env as any;
      if (env?.DB) {
        const d1Db = env.DB;
        const result = await d1Db.prepare(sql).bind(...params).run();
        return { success: result.success, meta: result.meta };
      }
    } catch (e) {
      // Fallback to local file DB
    }
    const results = await runLocalQuery(sql, params);
    return { success: true, meta: results[0] || {} };
  }
};
