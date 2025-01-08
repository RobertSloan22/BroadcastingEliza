import { Action, ActionContext } from '@eliza/types';
import { DiagramService } from '../services/diagram';

interface DiagramParams {
  action: 'search' | 'get' | 'save';
  query?: string;
  diagramId?: string;
  type?: 'repair' | 'parts' | 'wiring' | 'system';
  vehicleInfo?: {
    year?: string;
    make?: string;
    model?: string;
  };
  diagramData?: {
    title: string;
    url: string;
    type: 'repair' | 'parts' | 'wiring' | 'system';
    description?: string;
    annotations?: Array<{
      x: number;
      y: number;
      text: string;
    }>;
  };
}

export class TechnicalDiagramAction implements Action {
  name = 'technical_diagrams';
  description = 'Search and manage technical diagrams and documentation';

  constructor(private diagramService: DiagramService) {}

  async execute(context: ActionContext, params: DiagramParams) {
    try {
      switch (params.action) {
        case 'search':
          if (!params.query) {
            throw new Error('Search query is required');
          }
          const searchResults = await this.diagramService.searchDiagrams({
            query: params.query,
            type: params.type,
            vehicleInfo: params.vehicleInfo
          });
          return {
            status: 'success',
            data: searchResults,
            message: `Found ${searchResults.length} matching diagrams`
          };

        case 'get':
          if (!params.diagramId) {
            throw new Error('Diagram ID is required');
          }
          const diagram = await this.diagramService.getDiagram(params.diagramId);
          return {
            status: 'success',
            data: diagram,
            message: 'Retrieved diagram successfully'
          };

        case 'save':
          if (!params.diagramData) {
            throw new Error('Diagram data is required for saving');
          }
          const savedDiagram = await this.diagramService.saveDiagram(params.diagramData);
          return {
            status: 'success',
            data: savedDiagram,
            message: 'Diagram saved successfully'
          };

        default:
          throw new Error('Invalid action specified');
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process diagram request',
        message: 'Unable to process diagram request'
      };
    }
  }

  parameters = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['search', 'get', 'save'],
        description: 'Action to perform on diagrams'
      },
      query: {
        type: 'string',
        description: 'Search query for finding diagrams'
      },
      diagramId: {
        type: 'string',
        description: 'Diagram identifier for retrieval'
      },
      type: {
        type: 'string',
        enum: ['repair', 'parts', 'wiring', 'system'],
        description: 'Type of diagram'
      },
      vehicleInfo: {
        type: 'object',
        properties: {
          year: { type: 'string' },
          make: { type: 'string' },
          model: { type: 'string' }
        }
      },
      diagramData: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          type: {
            type: 'string',
            enum: ['repair', 'parts', 'wiring', 'system']
          },
          description: { type: 'string' },
          annotations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                text: { type: 'string' }
              }
            }
          }
        },
        required: ['title', 'url', 'type']
      }
    },
    required: ['action']
  };
}

export default TechnicalDiagramAction;