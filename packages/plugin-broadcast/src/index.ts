import { Plugin } from '@elizaos/core';
import { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import { broadcastTrackerAction } from './actions/broadcastTrackerAction';
import { vectorApiCall } from './actions/apiCall';

// Export individual actions
export { broadcastTrackerAction } from './actions/broadcastTrackerAction';
export { vectorApiCall } from './actions/apiCall';

// Export queries
export {
    FEED_QUERY,
    TOKEN_QUERY,
    PROFILE_QUERY
} from './actions/broadcastTrackerAction';

export const broadcastPlugin: Plugin = {
  name: 'broadcast',
  description: 'Plugin for broadcasting messages and tracking token broadcasts',
  actions: [
    broadcastTrackerAction,
    vectorApiCall
  ]
};

export default broadcastPlugin;