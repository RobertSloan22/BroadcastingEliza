import { Plugin } from '@elizaos/core';
import { apiCallAction } from './actions';
import * as types from './types';
import { databaseProvider } from './providers';
import { broadcastEvaluator } from './evaluators/broadcastEvaluator';

export const broadcastPlugin: Plugin = {
  name: 'broadcast',
  description: 'api call plugin',
  actions: [ apiCallAction ],
  providers: [ databaseProvider ],
  evaluators: [ broadcastEvaluator ]
};

export default broadcastPlugin;
export { apiCallAction } from './actions';
export { databaseProvider } from './providers';
export { broadcastEvaluator } from './evaluators/broadcastEvaluator';

export { types };



