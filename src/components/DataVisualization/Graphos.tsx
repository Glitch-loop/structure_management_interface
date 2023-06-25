import { Options, Edge, Node, DataSet, Network } from "vis-network";
import { useEffect, useState } from "react";
import useVisNetwork from "./useVisNetwork";


const Graphos = ({edges, nodes, options}: {edges: Edge[], nodes: Node[], options: any}) => {
  const { ref, network } = useVisNetwork({
    options,
    edges,
    nodes
  });
  return(
    <>
      {/* <button onClick={handleClick}>Focus</button> */}
      <div style={{ height: 600, width: "100%" }} ref={ref} />
    </>
  )
}

export default Graphos;