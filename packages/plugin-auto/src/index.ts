import { Plugin } from '@eliza/types';
import DiagnosticAction from './actions/diagnosticAction';
import RepairHistoryAction from './actions/repairHistoryAction';
import CustomerDataAction from './actions/customerDataAction';
import InvoiceAction from './actions/invoiceAction';
import TechnicalDiagramAction from './actions/technicalDiagramAction';
import NoteAction from './actions/noteAction';

import { CarMDService } from './services/carmd';
import { RepairHistoryService } from './services/repairHistory';
import { CustomerDataService } from './services/customerData';
import { InvoiceService } from './services/invoice';
import { DiagramService } from './services/diagram';
import { NoteService } from './services/note';

const autoPlugin: Plugin = {
  name: 'auto',
  version: '1.0.0',
  description: 'Automotive service and repair management plugin',

  async initialize(config: any) {
    // Initialize services
    const carmdService = new CarMDService(config.carmdApiKey);
    const repairHistoryService = new RepairHistoryService(config.database);
    const customerDataService = new CustomerDataService(config.database);
    const invoiceService = new InvoiceService(config.database);
    const diagramService = new DiagramService(config.database);
    const noteService = new NoteService(config.database);

    // Initialize and return actions
    return {
      actions: [
        new DiagnosticAction(carmdService),
        new RepairHistoryAction(repairHistoryService),
        new CustomerDataAction(customerDataService),
        new InvoiceAction(invoiceService),
        new TechnicalDiagramAction(diagramService),
        new NoteAction(noteService)
      ]
    };
  }
};

export default autoPlugin;

// Export individual components for direct usage
export {
  DiagnosticAction,
  RepairHistoryAction,
  CustomerDataAction,
  InvoiceAction,
  TechnicalDiagramAction,
  NoteAction,
  CarMDService,
  RepairHistoryService,
  CustomerDataService,
  InvoiceService,
  DiagramService,
  NoteService
};