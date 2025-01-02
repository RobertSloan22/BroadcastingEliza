import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { ServiceType } from "@elizaos/core";
import Papa from 'papaparse';

// Add CSV to ServiceType if not exists
enum LocalServiceType {
    CSV = 'csv'
}

interface ICSVService {
  processCSV(file: any): Promise<string>;
  analyzeCSV(content: string): Promise<CSVAnalysis>;
}

interface CSVAnalysis {
  rowCount: number;
  columnCount: number;
  columns: {
    name: string;
    type: string;
    uniqueValues: number;
    missingValues: number;
    summary: {
      min?: number;
      max?: number;
      mean?: number;
      mostCommon?: string;
    };
  }[];
}

const csvAnalysisAction: Action = {
  name: "ANALYZE_CSV",
  similes: ["READ_CSV", "PROCESS_CSV", "REVIEW_CSV"],
  description: "Analyzes uploaded CSV files and provides statistical insights",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    if (!message.content.attachments?.length) {
      return false;
    }
    const attachment = message.content.attachments[0];
    return attachment.type === "csv";
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const csvService = runtime.getService<ICSVService>(LocalServiceType.CSV);
      const attachment = message.content.attachments[0];

      // Process CSV content
      const csvContent = await csvService.processCSV(attachment);

      // Parse CSV using PapaParse
      const parsedData = Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });

      // Analyze CSV structure and content
      const analysis = await analyzeCSVData(parsedData.data);

      // Store analysis results
      await runtime.documentsManager.createMemory({
        id: generateId(),
        content: {
          text: csvContent,
          analysis: analysis,
          metadata: {
            fileName: attachment.name,
            dateProcessed: new Date().toISOString(),
            rowCount: analysis.rowCount,
            columnCount: analysis.columnCount
          }
        },
        userId: message.userId,
        roomId: message.roomId,
        createdAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error("CSV analysis failed:", error);
      return false;
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you analyze this CSV file?",
          attachments: [{ type: "csv", url: "data.csv" }],
        },
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll analyze that CSV file for you",
          action: "ANALYZE_CSV",
        },
      },
    ],
  ],
};

async function analyzeCSVData(data: any[]): Promise<CSVAnalysis> {
  const columns = Object.keys(data[0]);
  const analysis: CSVAnalysis = {
    rowCount: data.length,
    columnCount: columns.length,
    columns: []
  };

  for (const column of columns) {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined);
    const columnType = inferColumnType(values);

    const columnAnalysis = {
      name: column,
      type: columnType,
      uniqueValues: new Set(values).size,
      missingValues: data.length - values.length,
      summary: {}
    };

    if (columnType === 'number') {
      columnAnalysis.summary = {
        min: Math.min(...values),
        max: Math.max(...values),
        mean: values.reduce((a, b) => a + b, 0) / values.length
      };
    } else {
      const valueCounts = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});
      columnAnalysis.summary = {
        mostCommon: Object.entries(valueCounts)
          .sort(([,a], [,b]) => b - a)[0][0]
      };
    }

    analysis.columns.push(columnAnalysis);
  }

  return analysis;
}

function inferColumnType(values: any[]): string {
  const sample = values.find(v => v !== null && v !== undefined);
  if (typeof sample === 'number') return 'number';
  if (!isNaN(Date.parse(sample))) return 'date';
  return 'string';
}

export default csvAnalysisAction;