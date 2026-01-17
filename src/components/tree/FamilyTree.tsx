import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Users } from 'lucide-react';
import { EmptyState } from '../common';
import { PersonNode } from './PersonNode';
import type { Person, Relationship, RelationshipType } from '../../types';
import { RELATIONSHIP_CATEGORIES } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

interface FamilyTreeProps {
  people: Person[];
  relationships: Relationship[];
  onPersonClick?: (personId: string) => void;
  selectedPersonId?: string;
}



// =============================================================================
// CONSTANTS
// =============================================================================

const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 200;

const nodeTypes = {
  person: PersonNode,
};

// =============================================================================
// EDGE STYLES
// =============================================================================

const getEdgeStyle = (relationshipType: RelationshipType) => {
  if (RELATIONSHIP_CATEGORIES.parent.includes(relationshipType)) {
    // Biological = solid, others = dashed
    if (relationshipType === 'biological_parent') {
      return { stroke: '#6b7280', strokeWidth: 2 };
    }
    return { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5,5' };
  }
  
  if (RELATIONSHIP_CATEGORIES.spouse.includes(relationshipType)) {
    // Current spouse = double line effect, ex = dashed
    if (relationshipType === 'spouse' || relationshipType === 'partner') {
      return { stroke: '#ec4899', strokeWidth: 3 };
    }
    return { stroke: '#ec4899', strokeWidth: 2, strokeDasharray: '5,5' };
  }
  
  if (RELATIONSHIP_CATEGORIES.sibling.includes(relationshipType)) {
    return { stroke: '#3b82f6', strokeWidth: 2 };
  }
  
  return { stroke: '#6b7280', strokeWidth: 2 };
};

// =============================================================================
// LAYOUT ALGORITHM
// =============================================================================

function calculateLayout(
  people: Person[],
  relationships: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  if (people.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Build adjacency maps
  const childToParents = new Map<string, string[]>();
  const parentToChildren = new Map<string, string[]>();
  const spouses = new Map<string, string[]>();

  relationships.forEach((rel) => {
    if (RELATIONSHIP_CATEGORIES.parent.includes(rel.relationship_type)) {
      // person1 is parent, person2 is child
      const parents = childToParents.get(rel.person2_id) || [];
      parents.push(rel.person1_id);
      childToParents.set(rel.person2_id, parents);

      const children = parentToChildren.get(rel.person1_id) || [];
      children.push(rel.person2_id);
      parentToChildren.set(rel.person1_id, children);
    } else if (RELATIONSHIP_CATEGORIES.spouse.includes(rel.relationship_type)) {
      const spouse1List = spouses.get(rel.person1_id) || [];
      spouse1List.push(rel.person2_id);
      spouses.set(rel.person1_id, spouse1List);

      const spouse2List = spouses.get(rel.person2_id) || [];
      spouse2List.push(rel.person1_id);
      spouses.set(rel.person2_id, spouse2List);
    }
  });

  // Calculate generations (BFS from roots)
  const generations = new Map<string, number>();
  const personIds = new Set(people.map((p) => p.id));

  // Find roots (people with no parents)
  const roots = people.filter((p) => !childToParents.has(p.id) || childToParents.get(p.id)!.length === 0);
  
  // If no clear roots, start with oldest people
  const startNodes = roots.length > 0 ? roots : [people.sort((a, b) => 
    new Date(a.birthday).getTime() - new Date(b.birthday).getTime()
  )[0]];

  // BFS to assign generations
  const queue: { id: string; gen: number }[] = startNodes.map((p) => ({ id: p.id, gen: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    
    generations.set(id, Math.max(generations.get(id) || 0, gen));

    // Add children
    const children = parentToChildren.get(id) || [];
    children.forEach((childId) => {
      if (personIds.has(childId)) {
        queue.push({ id: childId, gen: gen + 1 });
      }
    });

    // Add spouses at same generation
    const spouseList = spouses.get(id) || [];
    spouseList.forEach((spouseId) => {
      if (personIds.has(spouseId) && !visited.has(spouseId)) {
        generations.set(spouseId, gen);
        queue.push({ id: spouseId, gen });
      }
    });
  }

  // Handle any unvisited nodes (disconnected)
  people.forEach((p) => {
    if (!generations.has(p.id)) {
      generations.set(p.id, 0);
    }
  });

  // Group by generation
  const genGroups = new Map<number, Person[]>();
  people.forEach((p) => {
    const gen = generations.get(p.id) || 0;
    const group = genGroups.get(gen) || [];
    group.push(p);
    genGroups.set(gen, group);
  });

  // Position nodes
  const nodes: Node[] = [];
  const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);

  sortedGens.forEach((gen) => {
    const group = genGroups.get(gen)!;
    const startX = -(group.length - 1) * HORIZONTAL_SPACING / 2;

    group.forEach((person, index) => {
      nodes.push({
        id: person.id,
        type: 'person',
        position: {
          x: startX + index * HORIZONTAL_SPACING,
          // Older generations should appear higher (smaller y)
          y: -gen * VERTICAL_SPACING,
        },
        data: {
          person,
        },
      });
    });
  });

  // Create edges
  const edges: Edge[] = [];
  const addedEdges = new Set<string>();

  relationships.forEach((rel) => {
    // Skip if either person is not in our people list
    if (!personIds.has(rel.person1_id) || !personIds.has(rel.person2_id)) {
      return;
    }

    const edgeId = `${rel.id}`;
    if (addedEdges.has(edgeId)) return;
    addedEdges.add(edgeId);

    const style = getEdgeStyle(rel.relationship_type);
    
    // Determine connection points based on relationship type
    let sourceHandle = undefined;
    let targetHandle = undefined;
    
    if (RELATIONSHIP_CATEGORIES.spouse.includes(rel.relationship_type)) {
      sourceHandle = 'right';
      targetHandle = 'left';
    }

    edges.push({
      id: edgeId,
      source: rel.person1_id,
      target: rel.person2_id,
      sourceHandle,
      targetHandle,
      style,
      type: 'smoothstep',
    });
  });

  return { nodes, edges };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function FamilyTree({
  people,
  relationships,
  onPersonClick,
  selectedPersonId,
}: FamilyTreeProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => calculateLayout(people, relationships),
    [people, relationships]
  );

  // Add onClick handler and selection state to nodes
  const nodesWithHandlers = useMemo(() => {
    return initialNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onClick: onPersonClick,
        isSelected: node.id === selectedPersonId,
      },
      selected: node.id === selectedPersonId,
    }));
  }, [initialNodes, onPersonClick, selectedPersonId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithHandlers);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useMemo(() => {
    setNodes(nodesWithHandlers);
  }, [nodesWithHandlers, setNodes]);

  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  if (people.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No family members yet"
          description="Add people to your family tree to see them here."
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls 
          showInteractive={false}
          className="!shadow-lg !rounded-lg !border !border-gray-200"
        />
        <MiniMap
          nodeColor={(node) => {
            const person = (node.data as { person: Person }).person;
            return person.is_living ? '#3b82f6' : '#9ca3af';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          className="!shadow-lg !rounded-lg !border !border-gray-200"
        />

        {/* Legend */}
        <Panel position="bottom-left" className="!m-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-500" />
                <span>Parent-Child</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-500" style={{ borderTop: '2px dashed #6b7280' }} />
                <span>Adoptive/Step</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-pink-500" />
                <span>Spouse/Partner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-500" />
                <span>Sibling</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
