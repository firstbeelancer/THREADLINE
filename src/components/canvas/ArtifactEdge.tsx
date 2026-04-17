import { memo, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export const ArtifactEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Call the onEdgeClick from data if provided
    if (data?.onEdgeClick) {
      data.onEdgeClick(id);
    }
  }, [id, data]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (data?.onEdgeContextMenu) {
      data.onEdgeContextMenu(e, id);
    }
  }, [id, data]);

  const isSelected = selected || data?.selectedEdgeId === id;

  return (
    <>
      {/* Invisible wide path for easy clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={25}
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />
      {/* Visible edge */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          stroke: isSelected ? '#22D3EE' : (style?.stroke || 'hsl(220, 15%, 35%)'),
          strokeWidth: isSelected ? 3 : 1.5,
        }}
        interactionWidth={30}
      />
      {/* Glow effect when selected */}
      {isSelected && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: '#22D3EE',
            strokeWidth: 8,
            opacity: 0.15,
            fill: 'none',
          }}
        />
      )}
    </>
  );
});

ArtifactEdge.displayName = 'ArtifactEdge';
