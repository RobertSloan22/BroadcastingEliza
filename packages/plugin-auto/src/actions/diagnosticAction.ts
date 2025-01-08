import { Action, ActionContext } from '@eliza/types';
import { CarMDService } from '../services/carmd';

interface DiagnosticParams {
  vin: string;
  code: string;
}

export class DiagnosticAction implements Action {
  name = 'diagnostic_tool';
  description = 'Get diagnostic information for vehicle trouble codes';

  constructor(private carmdService: CarMDService) {}

  async execute(context: ActionContext, params: DiagnosticParams) {
    try {
      const diagnosticInfo = await this.carmdService.getDiagnostics(
        params.vin,
        params.code
      );

      return {
        status: 'success',
        data: diagnosticInfo,
        message: `Retrieved diagnostic information for code ${params.code}`
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to get diagnostic information',
        message: 'Unable to retrieve diagnostic information'
      };
    }
  }

  parameters = {
    type: 'object',
    properties: {
      vin: {
        type: 'string',
        description: 'Vehicle Identification Number'
      },
      code: {
        type: 'string',
        description: 'Diagnostic Trouble Code (e.g., P0123)'
      }
    },
    required: ['vin', 'code']
  };
}

export default DiagnosticAction;