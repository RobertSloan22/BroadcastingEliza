import { Plugin } from '@elizaos/core';
import { apiCallAction } from './actions';
import * as types from './types';

export const broadcastPlugin: Plugin = {
  name: 'broadcast',
  description: 'api call plugin',
  actions: [ apiCallAction ],
  providers: [],
  evaluators: []

};

export default broadcastPlugin;
export { apiCallAction } from './actions';

export { types };



