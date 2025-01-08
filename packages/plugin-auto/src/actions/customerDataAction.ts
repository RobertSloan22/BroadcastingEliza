import {
    Action,
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass,
    Content,
} from "@elizaos/core";
\import { CustomerDataService } from '../services/customerData';

interface CustomerDataParams {
  action: 'search' | 'details' | 'create' | 'update';
  searchTerm?: string;
  customerId?: string;
  customerData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    notes?: string;
  };
}

export class CustomerDataAction implements Action {
  name = 'customer_data';
  description = 'Manage customer information and interactions';

  constructor(private customerService: CustomerDataService) {}

  async execute(context: ActionContext, params: CustomerDataParams) {
    try {
      switch (params.action) {
        case 'search':
          if (!params.searchTerm) {
            throw new Error('Search term is required for customer search');
          }
          const searchResults = await this.customerService.searchCustomers(params.searchTerm);
          return {
            status: 'success',
            data: searchResults,
            message: `Found ${searchResults.length} matching customers`
          };

        case 'details':
          if (!params.customerId) {
            throw new Error('Customer ID is required for details');
          }
          const customerDetails = await this.customerService.getCustomerDetails(params.customerId);
          return {
            status: 'success',
            data: customerDetails,
            message: 'Retrieved customer details successfully'
          };

        case 'create':
          if (!params.customerData) {
            throw new Error('Customer data is required for creation');
          }
          const newCustomer = await this.customerService.createCustomer(params.customerData);
          return {
            status: 'success',
            data: newCustomer,
            message: 'Customer created successfully'
          };

        case 'update':
          if (!params.customerId || !params.customerData) {
            throw new Error('Customer ID and update data are required');
          }
          const updatedCustomer = await this.customerService.updateCustomer(
            params.customerId,
            params.customerData
          );
          return {
            status: 'success',
            data: updatedCustomer,
            message: 'Customer updated successfully'
          };

        default:
          throw new Error('Invalid action specified');
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process customer data',
        message: 'Unable to process customer data request'
      };
    }
  }

  parameters = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['search', 'details', 'create', 'update'],
        description: 'Action to perform on customer data'
      },
      searchTerm: {
        type: 'string',
        description: 'Search term for finding customers'
      },
      customerId: {
        type: 'string',
        description: 'Customer identifier for details or updates'
      },
      customerData: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          phoneNumber: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    },
    required: ['action']
  };
}

export default CustomerDataAction;