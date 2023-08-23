import { useState, useLayoutEffect, useRef } from "react";
import {
  Network,
  Options,
  Data,
  Edge,
  Node
} from "vis-network/standalone/esm/vis-network";

export interface UseVisNetworkOptions {
  options: Options;
  nodes: Node[];
  edges: Edge[];
}

/*
  In this component we use the API to generete the "image" of the nodes.

  The result is the current structure as tree (that is naturally the structure
  that the members are organized).

  Remember:
    - Nodes = members themselves
    - Edges = The relation "leader <- follower" (Read it as leader of the follower)
    - options = Options that is going to have the image
*/

export default (props: UseVisNetworkOptions) => {
  const { edges, nodes, options } = props;

  const [network, addNetwork] = useState<Network | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const data: Data = { nodes, edges };

  useLayoutEffect(() => {
    if (ref.current) {
      const instance = new Network(ref.current, data, options);
      addNetwork(instance);
    }
    return () => network?.destroy();
  }, []);

  return {
    network,
    ref
  };
};
