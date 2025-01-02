import { Plugin } from '@elizaos/core';
import { broadcastTrackerAction, enhancedBroadcastTrackerAction, vectorApiAction, apiCallAction, graphCallAction } from './actions';

export const broadcastPlugin: Plugin = {
  name: 'broadcast',
  description: 'Plugin for broadcasting messages and tracking token broadcasts',
  actions: [
    broadcastTrackerAction,
    enhancedBroadcastTrackerAction,
    vectorApiAction,
    apiCallAction,
    graphCallAction
  ]
};

export default broadcastPlugin;