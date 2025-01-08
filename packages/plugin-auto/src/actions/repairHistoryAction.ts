import { Action, ActionContext } from '@eliza/types';
import { RepairHistoryService } from '../services/repairHistory';

interface RepairHistoryParams {
  action: 'log' | 'get';
  vehicle_id: string;
  repair_type?: string;
  description?: string;
  mileage?: number;
}

export class RepairHistoryAction implements Action {
  name = 'repair_history';
  description = 'Manage vehicle repair and maintenance history';

  constructor(private repairHistoryService: RepairHistoryService) {}

  async execute(context: ActionContext, params: RepairHistoryParams) {
    try {
      if (params.action === 'log') {
        if (!params.repair_type || !params.description) {
          throw new Error('Repair type and description are required for logging');
        }

        const entry = await this.repairHistoryService.logRepair({
          vehicle_id: params.vehicle_id,
          repair_type: params.repair_type,
          description: params.description,
          mileage: params.mileage,
          timestamp: new Date().toISOString()
        });

        return {
          status: 'success',
          data: entry,
          message: 'Repair history entry logged successfully'
        };
      } else {
        const history = await this.repairHistoryService.getRepairHistory(params.vehicle_id);
        return {
          status: 'success',
          data: history,
          message: `Retrieved repair history for vehicle ${params.vehicle_id}`
        };
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process repair history',
        message: 'Unable to process repair history request'
      };
    }
  }

  parameters = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['log', 'get'],
        description: 'Action to perform (log new repair or get history)'
      },
      vehicle_id: {
        type: 'string',
        description: 'Vehicle identifier (VIN or custom ID)'
      },
      repair_type: {
        type: 'string',
        description: 'Type of repair or maintenance performed'
      },
      description: {
        type: 'string',
        description: 'Detailed description of work performed'
      },
      mileage: {
        type: 'number',
        description: 'Vehicle mileage at time of repair'
      }
    },
    required: ['action', 'vehicle_id']
  };
}

export default RepairHistoryAction;