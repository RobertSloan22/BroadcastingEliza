import { Action, ActionContext } from '@eliza/types';
import { InvoiceService } from '../services/invoice';

interface InvoiceParams {
  action: 'create' | 'update' | 'get' | 'list';
  invoiceId?: string;
  customerId?: string;
  invoiceData?: {
    customerName: string;
    customerEmail?: string;
    phoneNumber?: string;
    vehicleId: string;
    services: Array<{
      description: string;
      cost: number;
      laborHours?: number;
      parts?: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
    }>;
    totalAmount: number;
    date: string;
    status: 'draft' | 'pending' | 'paid';
    notes?: string;
  };
}

export class InvoiceAction implements Action {
  name = 'invoice_service';
  description = 'Manage service invoices and billing';

  constructor(private invoiceService: InvoiceService) {}

  async execute(context: ActionContext, params: InvoiceParams) {
    try {
      switch (params.action) {
        case 'create':
          if (!params.invoiceData) {
            throw new Error('Invoice data is required for creation');
          }
          const newInvoice = await this.invoiceService.createInvoice(params.invoiceData);
          return {
            status: 'success',
            data: newInvoice,
            message: 'Invoice created successfully'
          };

        case 'update':
          if (!params.invoiceId || !params.invoiceData) {
            throw new Error('Invoice ID and update data are required');
          }
          const updatedInvoice = await this.invoiceService.updateInvoice(
            params.invoiceId,
            params.invoiceData
          );
          return {
            status: 'success',
            data: updatedInvoice,
            message: 'Invoice updated successfully'
          };

        case 'get':
          if (!params.invoiceId) {
            throw new Error('Invoice ID is required');
          }
          const invoice = await this.invoiceService.getInvoice(params.invoiceId);
          return {
            status: 'success',
            data: invoice,
            message: 'Retrieved invoice successfully'
          };

        case 'list':
          const filters = params.customerId ? { customerId: params.customerId } : undefined;
          const invoices = await this.invoiceService.listInvoices(filters);
          return {
            status: 'success',
            data: invoices,
            message: `Retrieved ${invoices.length} invoices`
          };

        default:
          throw new Error('Invalid action specified');
      }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process invoice',
        message: 'Unable to process invoice request'
      };
    }
  }

  parameters = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'update', 'get', 'list'],
        description: 'Action to perform on invoice'
      },
      invoiceId: {
        type: 'string',
        description: 'Invoice identifier for updates or retrieval'
      },
      customerId: {
        type: 'string',
        description: 'Customer identifier for filtering invoices'
      },
      invoiceData: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          customerEmail: { type: 'string' },
          phoneNumber: { type: 'string' },
          vehicleId: { type: 'string' },
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                cost: { type: 'number' },
                laborHours: { type: 'number' },
                parts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      quantity: { type: 'number' },
                      price: { type: 'number' }
                    }
                  }
                }
              }
            }
          },
          totalAmount: { type: 'number' },
          date: { type: 'string' },
          status: {
            type: 'string',
            enum: ['draft', 'pending', 'paid']
          },
          notes: { type: 'string' }
        },
        required: ['customerName', 'vehicleId', 'services', 'totalAmount', 'date', 'status']
      }
    },
    required: ['action']
  };
}

export default InvoiceAction;