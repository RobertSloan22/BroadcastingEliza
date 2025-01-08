import { Action, ActionContext } from '@eliza/types';
import { NoteService } from '../services/note';

interface NoteParams {
  action: 'save' | 'get' | 'search' | 'update';
  noteId?: string;
  searchTerm?: string;
  noteData?: {
    topic: string;
    tags: string[];
    keyPoints: string[];
    codeExamples?: Array<{
      language: string;
      code: string;
    }>;
    resources?: string[];
    vehicleId?: string;
    customerId?: string;
    serviceType?: string;
    timestamp?: string;
  };
}

export class NoteAction implements Action {
  name = 'note_taking';
  description = 'Manage repair and service notes';

  constructor(private noteService: NoteService) {}

  async execute(context: ActionContext, params: NoteParams) {
    try {
      switch (params.action) {
        case 'save':
          if (!params.noteData) {
            throw new Error('Note data is required for saving');
          }
          const savedNote = await this.noteService.saveNote({
            ...params.noteData,
            timestamp: params.noteData.timestamp || new Date().toISOString()
          });
          return {
            status: 'success',
            data: savedNote,
            message: 'Note saved successfully'
          };

        case 'get':
          if (!params.noteId) {
            throw new Error('Note ID is required');
          }
          const note = await this.noteService.getNote(params.noteId);
          return {
            status: 'success',
            data: note,
            message: 'Retrieved note successfully'
          };

        case 'search':
          if (!params.searchTerm) {
            throw new Error('Search term is required');
          }
          const searchResults = await this.noteService.searchNotes(params.searchTerm);
          return {
            status: 'success',
            data: searchResults,
            message: `Found ${searchResults.length} matching notes`
          };

        case 'update':
          if (!params.noteId || !params.noteData) {
            throw new Error('Note ID and update data are required');
          }
          const updatedNote = await this.noteService.updateNote(
            params.noteId,
            params.noteData
          );
          return {
            status: 'success',
            data: updatedNote,
            message: 'Note updated successfully'
          };

        default:
          throw new Error('Invalid action specified');
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process note',
        message: 'Unable to process note request'
      };
    }
  }

  parameters = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['save', 'get', 'search', 'update'],
        description: 'Action to perform on notes'
      },
      noteId: {
        type: 'string',
        description: 'Note identifier for retrieval or updates'
      },
      searchTerm: {
        type: 'string',
        description: 'Search term for finding notes'
      },
      noteData: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          keyPoints: {
            type: 'array',
            items: { type: 'string' }
          },
          codeExamples: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                language: { type: 'string' },
                code: { type: 'string' }
              }
            }
          },
          resources: {
            type: 'array',
            items: { type: 'string' }
          },
          vehicleId: { type: 'string' },
          customerId: { type: 'string' },
          serviceType: { type: 'string' },
          timestamp: { type: 'string' }
        },
        required: ['topic', 'tags', 'keyPoints']
      }
    },
    required: ['action']
  };
}

export default NoteAction;