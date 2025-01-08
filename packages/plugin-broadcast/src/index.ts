import { Plugin } from '@elizaos/core';
import { apiCallAction } from './actions';
import * as types from './types';
import { broadcastDataEvaluator } from './evaluators/broadcastDataEvaluator';
import { Provider } from '@elizaos/core';



export * as actions from "./actions";
export * as evaluators from "./evaluators";
export * as providers from "./providers";
export const broadcastPlugin: Plugin = {
  name: 'broadcast',
  description: 'api call plugin',
  actions: [ apiCallAction ],
  providers: [],
  evaluators: [  broadcastDataEvaluator ]
};

export default broadcastPlugin;
export { apiCallAction } from './actions';

export { types };

export * from './utils/graphql';
export * from './evaluators/broadcastEvaluator';



