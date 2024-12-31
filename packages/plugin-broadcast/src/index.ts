import { Plugin } from '@elizaos/core';
import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { broadcastTrackerAction } from './actions/broadcastTrackerAction';

export const broadcastPlugin: Plugin = {
  name: 'broadcast',
  description: 'Plugin for broadcasting messages and tracking token broadcasts',
  actions: [
    broadcastTrackerAction
  ]
};

export default broadcastPlugin;