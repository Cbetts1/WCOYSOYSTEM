import type { NodeDescriptor, RouteResult } from '@vaga/shared-types';
import { logger } from '@vaga/shared-utils';

const nodeRegistry = new Map<string, NodeDescriptor>();

export function registerNode(node: NodeDescriptor): void {
  nodeRegistry.set(node.nodeId, node);
  logger.info('AIM: node registered', { nodeId: node.nodeId, name: node.name });
}

export function routeMessage(
  targetNodeId: string,
  payload: unknown
): RouteResult {
  const node = nodeRegistry.get(targetNodeId);
  if (!node) {
    logger.warn('AIM: unknown node', { targetNodeId });
    return { success: false, nodeId: targetNodeId, error: 'Node not found' };
  }
  logger.info('AIM: routing message', { targetNodeId, action: (payload as Record<string, unknown>)?.action });
  return { success: true, nodeId: targetNodeId, response: { routed: true, node } };
}

export function listNodes(): NodeDescriptor[] {
  return Array.from(nodeRegistry.values());
}

export function getNode(nodeId: string): NodeDescriptor | undefined {
  return nodeRegistry.get(nodeId);
}

// Seed well-known internal nodes
export function bootstrapLocalNodes(): void {
  const nodes: NodeDescriptor[] = [
    {
      nodeId: 'node-api',
      name: 'Backend API',
      type: 'api',
      endpoint: 'http://backend-api:4000',
      capabilities: ['tasks', 'docks', 'vms', 'auth'],
    },
    {
      nodeId: 'node-worker',
      name: 'Arrow Worker',
      type: 'worker',
      endpoint: 'http://worker-arrow:4001',
      capabilities: ['arrow-jobs'],
    },
    {
      nodeId: 'node-frontend-user',
      name: 'User Frontend',
      type: 'frontend',
      endpoint: 'http://frontend-user:3000',
      capabilities: ['ui'],
    },
    {
      nodeId: 'node-frontend-admin',
      name: 'Admin Frontend',
      type: 'frontend',
      endpoint: 'http://frontend-admin:3001',
      capabilities: ['admin-ui'],
    },
  ];
  nodes.forEach(registerNode);
}
