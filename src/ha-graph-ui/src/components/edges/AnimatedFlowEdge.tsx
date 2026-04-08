import { BaseEdge, getBezierPath, useStore, type EdgeProps } from 'reactflow';

export function AnimatedFlowEdge({
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const sourceNode = useStore((s) => s.nodeInternals.get(source));
  const targetNode = useStore((s) => s.nodeInternals.get(target));

  // A flow is stopped if the source node or target node is toggled off
  const isSourceOff = sourceNode?.data?.actuator && !sourceNode.data.actuator.state;
  const isTargetOff = targetNode?.data?.actuator && !targetNode.data.actuator.state;
  const isFlowing = !isSourceOff && !isTargetOff;

  const flowThickness = data?.flowVolume ? Math.max(2, Math.min(6, data.flowVolume)) : 2;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: flowThickness, stroke: 'rgba(255,255,255,0.2)' }} />
      {isFlowing && (
        <>
          <circle r={flowThickness * 1.5} fill="#fff" style={{ filter: 'drop-shadow(0 0 4px #fff)' }}>
            <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r={flowThickness} fill="#fff" style={{ filter: 'drop-shadow(0 0 4px #fff)', opacity: 0.6 }}>
            <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </>
      )}
    </>
  );
}
